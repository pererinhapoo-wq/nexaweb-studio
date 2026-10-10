// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import { verifyClientSession } from './_portal-session.ts';

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Método não permitido.',
    });
  }

  // 1. Validação estrita da sessão HTTP-only do cliente
  const session = verifyClientSession(req);

  if (!session.authenticated || !session.projectId) {
    return res.status(401).json({
      error: 'Sessão ausente ou inválida.',
    });
  }

  // 2. Verificação de infraestrutura Supabase
  if (!supabase) {
    return res.status(503).json({
      error: 'Supabase não está configurado no servidor.',
    });
  }

  const projectId = session.projectId;

  try {
    // 3. Busca dos dados do projeto identificado exclusivamente pela sessão
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        client_id,
        name,
        plan,
        status,
        current_stage,
        progress_percent,
        headline_message,
        staging_url,
        production_url,
        estimated_delivery_date,
        published_at,
        delivered_at,
        created_at,
        updated_at
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        error: 'Projeto da sessão não encontrado.',
      });
    }

    // 4. Busca dos dados do cliente relacionado (somente campos não sensíveis)
    let clientInfo: { name: string | null; business_name: string | null } = {
      name: null,
      business_name: null,
    };

    if (project.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('name, business_name')
        .eq('id', project.client_id)
        .single();

      if (client) {
        clientInfo = {
          name: client.name || null,
          business_name: client.business_name || null,
        };
      }
    }

    // 5. Busca de atualizações visíveis ao cliente ordenadas cronologicamente
    const { data: updates } = await supabase
      .from('project_updates')
      .select('id, title, message, stage, progress_snapshot, created_at')
      .eq('project_id', projectId)
      .eq('visible_to_client', true)
      .order('created_at', { ascending: false });

    // 6. Busca de solicitações do projeto
    const { data: requests } = await supabase
      .from('client_requests')
      .select('id, category, title, description, status, priority, admin_reply, replied_at, created_at, updated_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // 7. Busca de revisões e homologações do projeto
    const { data: reviews } = await supabase
      .from('project_reviews')
      .select('id, version_label, test_url, status, client_feedback, reviewed_at, approved_at, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // 8. Resposta consolidada com sanitização total de dados sensíveis
    return res.status(200).json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        plan: project.plan,
        status: project.status,
        current_stage: project.current_stage,
        progress_percent: project.progress_percent,
        headline_message: project.headline_message,
        staging_url: project.staging_url,
        production_url: project.production_url,
        estimated_delivery_date: project.estimated_delivery_date,
        published_at: project.published_at,
        delivered_at: project.delivered_at,
        created_at: project.created_at,
        updated_at: project.updated_at,
      },
      client: clientInfo,
      updates: updates || [],
      requests: requests || [],
      reviews: reviews || [],
    });
  } catch (error) {
    console.error('Erro ao carregar dados do projeto na Área do Cliente:', error);
    return res.status(500).json({
      error: 'Erro interno ao carregar dados do projeto.',
    });
  }
}
