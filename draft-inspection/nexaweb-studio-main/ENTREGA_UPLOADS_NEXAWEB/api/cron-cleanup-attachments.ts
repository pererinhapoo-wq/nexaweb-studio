import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from './_session.ts';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

/**
 * Validação segura de token do Cron via comparação em tempo constante (timingSafeEqual).
 * O cabeçalho 'x-vercel-cron' NÃO é aceito isoladamente, pois pode ser falsificado por qualquer
 * requisição HTTP externa. A Vercel transmite o cabeçalho Authorization: Bearer <CRON_SECRET>
 * automaticamente em cada chamada quando a variável CRON_SECRET está definida nas configurações do projeto.
 */
function verifyCronSecret(req: any): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || typeof cronSecret !== 'string' || cronSecret.length < 16) {
    return false;
  }

  const authHeader = req.headers?.authorization;
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedToken = authHeader.slice(7).trim();
  const tokenBuf = Buffer.from(providedToken, 'utf8');
  const secretBuf = Buffer.from(cronSecret, 'utf8');

  if (tokenBuf.length !== secretBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuf, secretBuf);
}

/**
 * Endpoint de limpeza automática (Sweeper) para anexos órfãos e reservas expiradas.
 * 
 * Regras de Autorização:
 * 1. Requer cabeçalho Authorization: Bearer <CRON_SECRET> com timingSafeEqual,
 * 2. OU sessão de administrador autenticada via cookie (para disparos manuais no painel).
 * Cabeçalhos não autenticados como 'x-vercel-cron' são sumariamente bloqueados com HTTP 401.
 */
export default async function handler(req: any, res: any) {
  res.setHeader?.('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader?.('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // 1. Verificação rigorosa de autorização
  const isAuthorizedCron = verifyCronSecret(req);
  const isAdminSession = verifySession(req).authenticated;

  if (!isAuthorizedCron && !isAdminSession) {
    return res.status(401).json({ error: 'Acesso não autorizado para execução da rotina de limpeza.' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Serviço do Supabase indisponível no servidor.' });
  }

  try {
    // 2. Reivindica lote de anexos para limpeza concorrente com bloqueio atômico
    const batchSize = Math.min(parseInt(req.query?.batchSize, 10) || 20, 50);
    const leaseSeconds = 120; // 2 minutos de lease seguro para cada worker

    const { data: claimed, error: claimError } = await supabase.rpc('claim_attachments_for_cleanup', {
      p_batch_size: batchSize,
      p_lease_seconds: leaseSeconds,
    });

    if (claimError) {
      console.error('CRON_CLAIM_ERROR', claimError.message || claimError);
      return res.status(500).json({ error: 'Erro ao reivindicar anexos para limpeza.' });
    }

    const items = Array.isArray(claimed) ? claimed : [];
    if (items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum anexo pendente de limpeza no momento.',
        processed: 0,
        succeeded: 0,
        failed: 0,
      });
    }

    let succeeded = 0;
    let failed = 0;
    const results: Array<{
      id: string;
      storage_path: string;
      status: 'DELETED' | 'DELETION_FAILED' | 'DELETION_FAILED_UNRECORDED' | 'CONFIRMATION_FAILED';
      error?: string;
    }> = [];

    // 3. Processa cada anexo reivindicado com confirmação estrita de remoção física e de transação no banco
    for (const item of items) {
      const { attachment_id, storage_path, lease_token } = item;

      // Remoção física no bucket privado nexaweb-vault
      const { error: storageError } = await supabase.storage
        .from('nexaweb-vault')
        .remove([storage_path]);

      if (storageError) {
        // Falha na remoção física: NUNCA marca como excluído! Grava como DELETION_FAILED
        failed++;
        const errorMessage = storageError.message || 'Falha ao remover arquivo do Storage';
        console.error('CRON_STORAGE_REMOVE_FAILED', { storage_path, error: errorMessage });

        const { data: failData, error: failRpcError } = await supabase.rpc('record_attachment_cleanup_failure', {
          p_attachment_id: attachment_id,
          p_lease_token: lease_token,
          p_error: errorMessage,
        });

        if (failRpcError || !failData?.ok) {
          const failReason = failRpcError?.message || failData?.reason || 'Falha na RPC de registro de erro';
          console.error('CRON_RECORD_FAILURE_RPC_FAILED', { storage_path, error: failReason });

          // Diferenciação estrita: falha no Storage física e falha no registro de auditoria no banco
          // NÃO afirmamos que o banco foi atualizado para DELETION_FAILED
          results.push({
            id: attachment_id,
            storage_path,
            status: 'DELETION_FAILED_UNRECORDED',
            error: `Falha na remoção física (${errorMessage}), e o registro de falha no banco não foi concluído (${failReason}).`,
          });
        } else {
          results.push({
            id: attachment_id,
            storage_path,
            status: 'DELETION_FAILED',
            error: errorMessage,
          });
        }
      } else {
        // Remoção física confirmada no Storage: confirma no banco validando lease e resultado
        const { data: confirmData, error: confirmError } = await supabase.rpc('confirm_attachment_deleted', {
          p_attachment_id: attachment_id,
          p_lease_token: lease_token,
        });

        if (confirmError || !confirmData?.ok) {
          failed++;
          const reason = confirmError?.message || confirmData?.reason || 'Falha na confirmação da RPC de exclusão';
          console.error('CRON_CONFIRM_RPC_FAILED', { storage_path, error: reason });

          // O arquivo foi removido do Storage, mas a confirmação da transação no banco falhou ou o lease expirou/divergiu.
          // Não marcamos como DELETED e não forçamos record_attachment_cleanup_failure para evitar rejeição dupla pelo mesmo lease.
          results.push({
            id: attachment_id,
            storage_path,
            status: 'CONFIRMATION_FAILED',
            error: `Removido do Storage, mas confirmação no banco falhou: ${reason}`,
          });
        } else {
          succeeded++;
          results.push({ id: attachment_id, storage_path, status: 'DELETED' });
        }
      }
    }

    return res.status(200).json({
      success: true,
      processed: items.length,
      succeeded,
      failed,
      results,
    });
  } catch (error) {
    console.error('CRON_CLEANUP_FATAL_ERROR', error);
    return res.status(500).json({ error: 'Erro inesperado na execução da rotina de limpeza.' });
  }
}
