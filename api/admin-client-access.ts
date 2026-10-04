import crypto from 'crypto';
// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import { verifySession, parseJsonBody } from './_session.ts';

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

export default async function handler(req: any, res: any) {
  // Configura cabeçalhos de segurança contra cache
  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido.',
    });
  }

  // 1. Validação estrita da sessão de administrador
  const auth = verifySession(req);
  if (!auth.authenticated) {
    return res.status(401).json({
      error: 'Não autorizado. Sessão administrativa necessária.',
    });
  }

  // 2. Validação da conexão com Supabase
  if (!supabase) {
    return res.status(503).json({
      error: 'Supabase não está configurado no servidor.',
    });
  }

  try {
    const body = (req.body && typeof req.body === 'object')
      ? req.body
      : await parseJsonBody(req);

    const { action, projectId } = body || {};

    if (
      typeof action !== 'string' ||
      !['generate', 'regenerate', 'revoke'].includes(action) ||
      typeof projectId !== 'string' ||
      !projectId.trim()
    ) {
      return res.status(400).json({
        error: 'Ação ou ID de projeto inválido.',
      });
    }

    const cleanProjectId = projectId.trim();

    // 3. Verificação de existência do projeto no banco
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', cleanProjectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        error: 'Projeto não encontrado.',
      });
    }

    const nowIso = new Date().toISOString();

    // 4. Fluxo de GERAÇÃO (generate)
    if (action === 'generate') {
      // Impede múltiplos acessos ativos para o mesmo projeto
      const { data: existingActive } = await supabase
        .from('client_access')
        .select('id')
        .eq('project_id', cleanProjectId)
        .eq('is_active', true)
        .is('revoked_at', null)
        .maybeSingle();

      if (existingActive) {
        return res.status(409).json({
          error: 'Já existe um acesso ativo para este projeto. Utilize a opção de regenerar para substituí-lo.',
        });
      }

      // Gera token criptográfico de alta entropia
      const rawToken = 'nwx_' + crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const { data: newAccess, error: insertError } = await supabase
        .from('client_access')
        .insert({
          project_id: cleanProjectId,
          token_hash: tokenHash,
          is_active: true,
          access_count: 0,
        })
        .select('id')
        .single();

      if (insertError || !newAccess) {
        return res.status(500).json({
          error: 'Erro ao gerar acesso para o projeto.',
        });
      }

      // Registro de auditoria em project_history
      try {
        await supabase.from('project_history').insert({
          project_id: cleanProjectId,
          action: 'ACCESS_GENERATED',
          details: {
            access_id: newAccess.id,
          },
        });
      } catch (histErr) {
        console.error('Erro não fatal ao auditar ACCESS_GENERATED:', histErr);
      }

      return res.status(200).json({
        success: true,
        token: rawToken,
        accessId: newAccess.id,
        projectId: cleanProjectId,
      });
    }

    // 5. Fluxo de REGENERAÇÃO (regenerate)
    if (action === 'regenerate') {
      // Invalida todos os acessos ativos anteriores do projeto
      await supabase
        .from('client_access')
        .update({
          is_active: false,
          revoked_at: nowIso,
        })
        .eq('project_id', cleanProjectId)
        .eq('is_active', true);

      // Gera novo token de alta entropia
      const rawToken = 'nwx_' + crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const { data: newAccess, error: insertError } = await supabase
        .from('client_access')
        .insert({
          project_id: cleanProjectId,
          token_hash: tokenHash,
          is_active: true,
          access_count: 0,
        })
        .select('id')
        .single();

      if (insertError || !newAccess) {
        return res.status(500).json({
          error: 'Erro ao regenerar acesso para o projeto.',
        });
      }

      // Registro de auditoria em project_history
      try {
        await supabase.from('project_history').insert({
          project_id: cleanProjectId,
          action: 'ACCESS_REGENERATED',
          details: {
            access_id: newAccess.id,
          },
        });
      } catch (histErr) {
        console.error('Erro não fatal ao auditar ACCESS_REGENERATED:', histErr);
      }

      return res.status(200).json({
        success: true,
        token: rawToken,
        accessId: newAccess.id,
        projectId: cleanProjectId,
      });
    }

    // 6. Fluxo de REVOGAÇÃO (revoke)
    if (action === 'revoke') {
      const { error: revokeError } = await supabase
        .from('client_access')
        .update({
          is_active: false,
          revoked_at: nowIso,
        })
        .eq('project_id', cleanProjectId)
        .eq('is_active', true);

      if (revokeError) {
        return res.status(500).json({
          error: 'Erro ao revogar acesso do projeto.',
        });
      }

      // Registro de auditoria em project_history
      try {
        await supabase.from('project_history').insert({
          project_id: cleanProjectId,
          action: 'ACCESS_REVOKED',
          details: {
            revoked_at: nowIso,
          },
        });
      } catch (histErr) {
        console.error('Erro não fatal ao auditar ACCESS_REVOKED:', histErr);
      }

      return res.status(200).json({
        success: true,
      });
    }

    return res.status(400).json({
      error: 'Ação não reconhecida.',
    });
  } catch (error) {
    console.error('Erro no gerenciamento de acesso do cliente:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar acesso do cliente.',
    });
  }
}
