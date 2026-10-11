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
 * Regras de Autorização e Proteção CSRF:
 * 1. Chamadas automatizadas da Vercel (GET ou POST):
 *    - Requerem estritamente Authorization: Bearer <CRON_SECRET> com timingSafeEqual.
 *    - Se for GET, a presença de sessão administrativa NÃO autoriza a execução,
 *      eliminando vulnerabilidades de CSRF acionadas via <img>, <iframe> ou links.
 * 2. Execuções manuais administrativas:
 *    - Devem ser submetidas via POST autenticado por cookie de administrador.
 *    - Proteção CSRF validada via cabeçalhos seguros (Sec-Fetch-Site: same-origin ou X-Requested-With / X-Admin-Action).
 */
export default async function handler(req: any, res: any) {
  res.setHeader?.('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader?.('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // 1. Verificação rigorosa de autorização e proteção contra CSRF
  const isAuthorizedCron = verifyCronSecret(req);
  const session = verifySession(req);
  const isAdminSession = session?.authenticated === true;

  if (req.method === 'GET') {
    // Vercel Cron aciona via GET com Bearer <CRON_SECRET>.
    // GET com sessão administrativa é bloqueado para prevenir CSRF por links/tags externas.
    if (!isAuthorizedCron) {
      return res.status(401).json({
        error: 'Acesso via GET requer autenticação do agendador via token CRON_SECRET no cabeçalho Authorization.',
      });
    }
  } else if (req.method === 'POST') {
    if (!isAuthorizedCron) {
      if (!isAdminSession) {
        return res.status(401).json({
          error: 'Acesso não autorizado para execução da rotina de limpeza.',
        });
      }

      // Validação CSRF para disparos manuais no painel do administrador
      const secFetchSite = req.headers?.['sec-fetch-site'];
      const xRequestedWith = req.headers?.['x-requested-with'];
      const customAction = req.headers?.['x-admin-action'];

      const isSameOrigin = secFetchSite === 'same-origin' || secFetchSite === 'none';
      const hasSecureHeader = xRequestedWith === 'XMLHttpRequest' || customAction === 'cleanup-attachments';

      if (!isSameOrigin && !hasSecureHeader) {
        return res.status(403).json({
          error: 'Requisição manual bloqueada por proteção contra CSRF. Requer cabeçalho seguro ou mesma origem.',
        });
      }
    }
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Serviço do Supabase indisponível no servidor.' });
  }

  // 2. Consulta de anexos em quarentena (sem acionar deleção) para inspeção administrativa
  const action = typeof req.query?.action === 'string' ? req.query.action.toLowerCase() : '';
  if (action === 'quarantine' || action === 'view-quarantined') {
    try {
      const { data: quarantinedList, error: qErr } = await supabase.rpc('get_quarantined_attachments', {
        p_min_attempts: 10,
        p_limit: 50,
      });

      if (qErr) {
        const { data: fallbackList, error: fallbackErr } = await supabase
          .from('project_attachments')
          .select('id, project_id, storage_path, mime_type, size_bytes, state, cleanup_attempts, last_cleanup_error, quarantine_notes, quarantine_resolved_at, pending_dismiss_justification, admin_retry_requested_at, dismiss_failure_count, dismiss_paused_at, dismiss_pause_reason, created_at, updated_at')
          .neq('state', 'DELETED')
          .is('quarantine_resolved_at', null)
          .gte('cleanup_attempts', 10)
          .order('updated_at', { ascending: false })
          .limit(50);

        if (fallbackErr) {
          return res.status(500).json({ error: 'Erro ao consultar quarentena de anexos.', details: fallbackErr.message });
        }

        return res.status(200).json({
          success: true,
          quarantinedCount: Array.isArray(fallbackList) ? fallbackList.length : 0,
          quarantined: fallbackList || [],
        });
      }

      return res.status(200).json({
        success: true,
        quarantinedCount: Array.isArray(quarantinedList) ? quarantinedList.length : 0,
        quarantined: quarantinedList || [],
      });
    } catch (qEx: any) {
      return res.status(500).json({ error: 'Exceção ao consultar quarentena.', details: qEx?.message });
    }
  }

  try {
    // 3. Reivindica lote de anexos para limpeza concorrente com bloqueio atômico
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

    // Consulta total de itens em quarentena pendentes de resolução no sistema (exclui DELETED e resolvidos)
    let quarantinedCount = 0;
    try {
      const { count } = await supabase
        .from('project_attachments')
        .select('id', { count: 'exact', head: true })
        .neq('state', 'DELETED')
        .is('quarantine_resolved_at', null)
        .gte('cleanup_attempts', 10);
      quarantinedCount = typeof count === 'number' ? count : 0;
    } catch {
      // contagem não-bloqueante
    }

    const items = Array.isArray(claimed) ? claimed : [];
    if (items.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum anexo pendente de limpeza no momento.',
        processed: 0,
        succeeded: 0,
        failed: 0,
        quarantined: quarantinedCount,
      });
    }

    let succeeded = 0;
    let failed = 0;
    const results: Array<{
      id: string;
      storage_path: string;
      status: 'DELETED' | 'DELETION_FAILED' | 'DELETION_FAILED_UNRECORDED' | 'CONFIRMATION_FAILED';
      error?: string;
      quarantined?: boolean;
      is_paused?: boolean;
      dismiss_failure_count?: number;
    }> = [];

    // 4. Processa cada anexo reivindicado com confirmação estrita de remoção física e de transação no banco
    for (const item of items) {
      const {
        attachment_id,
        storage_path,
        lease_token,
        cleanup_attempts,
        is_pending_dismiss,
        dismiss_justification,
      } = item;

      const isPendingDismiss = Boolean(is_pending_dismiss);
      const justification = (dismiss_justification || 'Expurgo de quarentena recuperado via rotina de limpeza').trim();

      // 4.1 Verificação prévia de existência no Storage (trata falha de listagem separadamente)
      let fileExists = true;
      let listingError: string | null = null;

      try {
        const lastSlashIndex = storage_path.lastIndexOf('/');
        const folder = lastSlashIndex !== -1 ? storage_path.substring(0, lastSlashIndex) : '';
        const fileName = lastSlashIndex !== -1 ? storage_path.substring(lastSlashIndex + 1) : storage_path;

        const { data: listData, error: listErr } = await supabase.storage
          .from('nexaweb-vault')
          .list(folder, { search: fileName, limit: 1 });

        if (listErr) {
          listingError = listErr.message || 'Falha ao consultar listagem no Storage';
        } else if (Array.isArray(listData)) {
          fileExists = listData.some((obj) => obj.name === fileName);
        }
      } catch (listEx: any) {
        listingError = listEx?.message || 'Exceção na consulta de listagem no Storage';
      }

      if (listingError) {
        failed++;
        console.error('CRON_STORAGE_LISTING_FAILED', { storage_path, error: listingError });
        const { data: failListingData } = await supabase.rpc('record_attachment_cleanup_failure', {
          p_attachment_id: attachment_id,
          p_lease_token: lease_token,
          p_error: `FALHA_LISTAGEM_STORAGE: ${listingError}`,
        });
        results.push({
          id: attachment_id,
          storage_path,
          status: 'DELETION_FAILED',
          error: `Falha na verificação de existência no Storage: ${listingError}`,
          quarantined: (cleanup_attempts >= 10),
          is_paused: Boolean(failListingData?.is_paused),
          dismiss_failure_count: failListingData?.dismiss_failure_count,
        });
        continue;
      }

      // 4.2 Se o arquivo já não existe no Storage (remoção anterior confirmada ou arquivo já expurgado)
      if (!fileExists) {
        console.log('CRON_FILE_ALREADY_REMOVED_RECOVERING', { storage_path, isPendingDismiss });

        let confirmData: any = null;
        let confirmError: any = null;

        if (isPendingDismiss) {
          const res = await supabase.rpc('admin_dismiss_quarantined_attachment', {
            p_attachment_id: attachment_id,
            p_justification: justification,
            p_lease_token: lease_token,
          });
          confirmData = res.data;
          confirmError = res.error;
        } else {
          const res = await supabase.rpc('confirm_attachment_deleted', {
            p_attachment_id: attachment_id,
            p_lease_token: lease_token,
          });
          confirmData = res.data;
          confirmError = res.error;
        }

        if (confirmError || !confirmData?.ok) {
          failed++;
          const reason = confirmError?.message || confirmData?.reason || 'Falha na confirmação de recuperação no banco';
          console.error('CRON_RECOVERY_CONFIRM_FAILED', { storage_path, error: reason });
          results.push({
            id: attachment_id,
            storage_path,
            status: 'CONFIRMATION_FAILED',
            error: `Arquivo ausente do Storage, mas confirmação de recuperação no banco falhou: ${reason}`,
            quarantined: (cleanup_attempts >= 10),
          });
        } else {
          succeeded++;
          results.push({ id: attachment_id, storage_path, status: 'DELETED' });
        }
        continue;
      }

      // 4.3 Se o arquivo ainda existe no Storage: executa a remoção física
      const { error: storageError } = await supabase.storage
        .from('nexaweb-vault')
        .remove([storage_path]);

      if (storageError) {
        failed++;
        const errorMessage = storageError.message || 'Falha ao remover arquivo do Storage';
        console.error('CRON_STORAGE_REMOVE_FAILED', { storage_path, error: errorMessage });

        const { data: failData, error: failRpcError } = await supabase.rpc('record_attachment_cleanup_failure', {
          p_attachment_id: attachment_id,
          p_lease_token: lease_token,
          p_error: errorMessage,
        });

        const isQuarantined = Boolean(failData?.quarantined || (typeof cleanup_attempts === 'number' && cleanup_attempts >= 10));

        if (failRpcError || !failData?.ok) {
          const failReason = failRpcError?.message || failData?.reason || 'Falha na RPC de registro de erro';
          console.error('CRON_RECORD_FAILURE_RPC_FAILED', { storage_path, error: failReason });

          results.push({
            id: attachment_id,
            storage_path,
            status: 'DELETION_FAILED_UNRECORDED',
            error: `Falha na remoção física (${errorMessage}), e o registro de falha no banco não foi concluído (${failReason}).`,
            quarantined: isQuarantined,
          });
        } else {
          results.push({
            id: attachment_id,
            storage_path,
            status: 'DELETION_FAILED',
            error: errorMessage,
            quarantined: isQuarantined,
            is_paused: Boolean(failData?.is_paused),
            dismiss_failure_count: failData?.dismiss_failure_count,
          });
        }
        continue;
      }

      // 4.4 Remoção física confirmada: confirma no banco validando lease e intenção
      let confirmData: any = null;
      let confirmError: any = null;

      if (isPendingDismiss) {
        const res = await supabase.rpc('admin_dismiss_quarantined_attachment', {
          p_attachment_id: attachment_id,
          p_justification: justification,
          p_lease_token: lease_token,
        });
        confirmData = res.data;
        confirmError = res.error;
      } else {
        const res = await supabase.rpc('confirm_attachment_deleted', {
          p_attachment_id: attachment_id,
          p_lease_token: lease_token,
        });
        confirmData = res.data;
        confirmError = res.error;
      }

      if (confirmError || !confirmData?.ok) {
        failed++;
        const reason = confirmError?.message || confirmData?.reason || 'Falha na confirmação da RPC de exclusão';
        console.error('CRON_CONFIRM_RPC_FAILED', { storage_path, error: reason });

        results.push({
          id: attachment_id,
          storage_path,
          status: 'CONFIRMATION_FAILED',
          error: `Removido do Storage, mas confirmação no banco falhou: ${reason}`,
          quarantined: (cleanup_attempts >= 10),
        });
      } else {
        succeeded++;
        results.push({ id: attachment_id, storage_path, status: 'DELETED' });
      }
    }

    return res.status(200).json({
      success: true,
      processed: items.length,
      succeeded,
      failed,
      quarantined: quarantinedCount,
      results,
    });
  } catch (error) {
    console.error('CRON_CLEANUP_FATAL_ERROR', error);
    return res.status(500).json({ error: 'Erro inesperado na execução da rotina de limpeza.' });
  }
}
