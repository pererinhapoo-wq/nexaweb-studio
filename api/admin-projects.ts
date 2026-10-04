import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { verifySession } from './_session.ts';

dotenv.config();

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey);
}

export default async function handler(req: any, res: any) {
  // 1. Apenas método GET é permitido
  if (req.method !== 'GET') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'GET');
    }
    return res.status(405).json({
      error: 'Método não permitido. Utilize GET.',
    });
  }

  // 2. Proteção de autenticação administrativa reutilizando o padrão seguro do projeto
  const session = verifySession(req);
  if (!session.authenticated) {
    return res.status(401).json({
      error: 'Não autorizado. Sessão administrativa necessária.',
    });
  }

  // 3. Inicialização segura do cliente Supabase com Service Role no backend
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(503).json({
      error: 'Serviço de banco de dados não configurado.',
    });
  }

  try {
    // 4. Busca os projetos reais existentes na tabela public.projects
    const { data: projects, error: projectsError } = await supabase
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
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Erro ao buscar projetos do Supabase:', projectsError.message);
      return res.status(500).json({
        error: 'Não foi possível carregar os projetos.',
      });
    }

    const projectList = projects || [];

    // 5. Coleta os client_ids para buscar dados básicos de clientes de forma segura
    const clientIds = Array.from(
      new Set(projectList.map((p) => p.client_id).filter(Boolean))
    );

    const clientsById: Record<
      string,
      {
        id: string;
        name: string | null;
        business_name: string | null;
        email: string | null;
        phone: string | null;
      }
    > = {};

    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, business_name, email, phone')
        .in('id', clientIds);

      if (clientsError) {
        console.error('Erro ao buscar clientes associados:', clientsError.message);
      } else if (clients) {
        for (const c of clients) {
          clientsById[c.id] = c;
        }
      }
    }

    // 6. Formata a resposta com os dados necessários para o painel Admin
    const formattedProjects = projectList.map((p) => {
      const client = p.client_id ? clientsById[p.client_id] : null;

      return {
        id: p.id, // UUID real do Supabase
        clientId: p.client_id || null,
        projectName: p.name || 'Projeto sem nome',
        clientName: client?.name || client?.business_name || 'Cliente NexaWeb',
        clientBusinessName: client?.business_name || null,
        clientEmail: client?.email || null,
        clientPhone: client?.phone || null,
        plan: p.plan || 'Essencial',
        status: p.status || 'Planejamento',
        currentStage: p.current_stage || 'Briefing',
        progressPercent: typeof p.progress_percent === 'number' ? p.progress_percent : 0,
        headlineMessage: p.headline_message || '',
        stagingUrl: p.staging_url || null,
        productionUrl: p.production_url || null,
        estimatedDeliveryDate: p.estimated_delivery_date || null,
        publishedAt: p.published_at || null,
        deliveredAt: p.delivered_at || null,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });

    return res.status(200).json({
      success: true,
      projects: formattedProjects,
    });
  } catch (error) {
    console.error('Erro interno ao listar projetos para o admin:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar a lista de projetos.',
    });
  }
}
