// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import {
  hashToken,
  createClientSessionToken,
  serializeClientSessionCookie,
  parseJsonBody,
} from './portal-session.ts';

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido.',
    });
  }

  if (!process.env.NEXAWEB_CLIENT_SESSION_SECRET) {
    return res.status(503).json({
      error: 'Autenticação da Área do Cliente não configurada.',
    });
  }

  if (!supabase) {
    return res.status(503).json({
      error: 'Supabase não está configurado no servidor.',
    });
  }

  try {
    const body = (req.body && typeof req.body === 'object')
      ? req.body
      : await parseJsonBody(req);

    const token = body?.token;

    if (typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        error: 'Token de acesso é obrigatório.',
      });
    }

    const tokenHash = hashToken(token);

    const { data: access, error: accessError } = await supabase
      .from('client_access')
      .select('id, project_id, is_active, expires_at, revoked_at, access_count')
      .eq('token_hash', tokenHash)
      .eq('is_active', true)
      .is('revoked_at', null)
      .single();

    if (accessError || !access) {
      return res.status(401).json({
        error: 'Acesso inválido ou revogado.',
      });
    }

    if (access.expires_at) {
      const expiresAtMs = new Date(access.expires_at).getTime();
      if (!Number.isNaN(expiresAtMs) && Date.now() > expiresAtMs) {
        return res.status(401).json({
          error: 'Acesso expirado.',
        });
      }
    }

    // Atualiza contagem de acessos e último uso de forma atômica
    const nextCount = (typeof access.access_count === 'number' ? access.access_count : 0) + 1;
    await supabase
      .from('client_access')
      .update({
        access_count: nextCount,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', access.id);

    // Registra evento de auditoria controlado em project_history
    try {
      await supabase.from('project_history').insert({
        project_id: access.project_id,
        action: 'PORTAL_LOGIN',
        details: {
          access_id: access.id,
        },
      });
    } catch (historyErr) {
      console.error('Erro não fatal ao registrar histórico de login do portal:', historyErr);
    }

    // Cria a sessão HMAC do cliente vinculada ao project_id interno
    const sessionToken = createClientSessionToken({
      projectId: access.project_id,
      accessId: access.id,
    });

    if (!sessionToken) {
      return res.status(503).json({
        error: 'Não foi possível gerar a sessão do cliente.',
      });
    }

    const cookieHeader = serializeClientSessionCookie(sessionToken, req);

    if (typeof res.setHeader === 'function') {
      res.setHeader('Set-Cookie', cookieHeader);
    }

    return res.status(200).json({
      success: true,
      message: 'Autenticado com sucesso na Área do Cliente.',
    });
  } catch (error) {
    console.error('Erro na autenticação da Área do Cliente:', error);
    return res.status(500).json({
      error: 'Erro interno ao autenticar na Área do Cliente.',
    });
  }
}
