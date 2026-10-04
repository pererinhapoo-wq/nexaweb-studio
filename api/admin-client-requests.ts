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
  // Configuração defensiva para ambientes Serverless / Express / Connect
  if (!res.status) {
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }
  if (!res.json) {
    res.json = (data: any) => {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
      }
      res.end(JSON.stringify(data));
      return res;
    };
  }

  // Previne cache em respostas administrativas
  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }

  // 1. Aceitar somente método GET
  if (req.method !== 'GET') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'GET');
    }
    return res.status(405).json({
      error: 'Método não permitido. Utilize GET.',
    });
  }

  // 2. Proteção estrita de autenticação administrativa
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
    // 4. Busca solicitações em client_requests ordenadas cronologicamente decrescente
    const { data: rawRequests, error: requestsError } = await supabase
      .from('client_requests')
      .select(`
        id,
        project_id,
        title,
        description,
        category,
        priority,
        status,
        admin_reply,
        replied_at,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Erro ao buscar solicitações no Supabase:', requestsError.message);
      return res.status(500).json({
        error: 'Não foi possível carregar as solicitações.',
      });
    }

    const requestsList = rawRequests || [];

    // 5. Coleta os project_ids para buscar dados dos projetos relacionados
    const projectIds = Array.from(
      new Set(requestsList.map((r) => r.project_id).filter(Boolean))
    );

    const projectsById: Record<
      string,
      {
        id: string;
        name: string;
        clientId: string | null;
      }
    > = {};

    const clientIds: string[] = [];

    if (projectIds.length > 0) {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, client_id')
        .in('id', projectIds);

      if (projectsError) {
        console.error('Erro ao buscar projetos vinculados:', projectsError.message);
      } else if (projectsData) {
        for (const p of projectsData) {
          projectsById[p.id] = {
            id: p.id,
            name: p.name || 'Projeto sem nome',
            clientId: p.client_id || null,
          };
          if (p.client_id) {
            clientIds.push(p.client_id);
          }
        }
      }
    }

    // 6. Coleta os client_ids para buscar dados dos clientes vinculados
    const uniqueClientIds = Array.from(new Set(clientIds));
    const clientsById: Record<
      string,
      {
        id: string;
        name: string | null;
        business_name: string | null;
        email: string | null;
      }
    > = {};

    if (uniqueClientIds.length > 0) {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, business_name, email')
        .in('id', uniqueClientIds);

      if (clientsError) {
        console.error('Erro ao buscar clientes vinculados:', clientsError.message);
      } else if (clientsData) {
        for (const c of clientsData) {
          clientsById[c.id] = c;
        }
      }
    }

    // 7. Formata e sanitiza os dados para consumo no painel Admin
    const formattedRequests = requestsList.map((r) => {
      const project = r.project_id ? projectsById[r.project_id] : null;
      const client = project?.clientId ? clientsById[project.clientId] : null;

      return {
        id: r.id,
        projectId: r.project_id || null,
        projectName: project?.name || 'Projeto não identificado',
        clientName: client?.name || client?.business_name || 'Cliente NexaWeb',
        clientBusinessName: client?.business_name || null,
        clientEmail: client?.email || null,
        title: r.title || 'Sem título',
        description: r.description || '',
        category: r.category || 'Geral',
        priority: r.priority || 'Normal',
        status: r.status || 'Novo',
        adminReply: r.admin_reply || null,
        repliedAt: r.replied_at || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    return res.status(200).json({
      success: true,
      requests: formattedRequests,
    });
  } catch (error) {
    console.error('Erro interno ao listar solicitações para o admin:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar a lista de solicitações.',
    });
  }
}
