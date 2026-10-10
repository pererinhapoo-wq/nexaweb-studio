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

  // Previne cache em respostas administrativas
  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }

  // Extrai parâmetros de consulta (suporta req.query ou parse de req.url)
  const queryParams: Record<string, string> = {};
  if (req.query && typeof req.query === 'object') {
    Object.assign(queryParams, req.query);
  }
  if (typeof req.url === 'string' && req.url.includes('?')) {
    try {
      const searchPart = req.url.split('?')[1];
      const parsed = new URLSearchParams(searchPart);
      parsed.forEach((val, key) => {
        queryParams[key] = val;
      });
    } catch {
      // ignore parse errors
    }
  }

  // 4. Ação: Buscar arquivos do briefing no Supabase Storage exclusivamente por projectId determinístico
  if (queryParams.action === 'briefing-files') {
    try {
      const cleanProjectId = (queryParams.projectId || '').trim();
      const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      // 1. Validação estrita de formato UUID v4
      if (!cleanProjectId || !UUID_REGEX.test(cleanProjectId)) {
        return res.status(200).json({
          success: true,
          files: [],
        });
      }

      // 2. Validação no banco com Service Role: confirma que o projectId realmente existe
      const { data: projectRecord, error: projectErr } = await supabase
        .from('projects')
        .select('id')
        .eq('id', cleanProjectId)
        .single();

      if (projectErr || !projectRecord) {
        return res.status(200).json({
          success: true,
          files: [],
        });
      }

      // 3. Listagem estrita: consulta exclusivamente a pasta 'briefings/{projectId}' no bucket privado
      const targetFolder = `briefings/${cleanProjectId}`;
      const { data: storageObjects, error: storageErr } = await supabase.storage
        .from('nexaweb-vault')
        .list(targetFolder, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (storageErr || !storageObjects || storageObjects.length === 0) {
        return res.status(200).json({
          success: true,
          files: [],
        });
      }

      // 4. Gera URLs assinadas temporárias válidas por 1 hora exclusivamente para os arquivos da pasta
      const formattedFiles: Array<{
        name: string;
        path: string;
        url: string;
        isImage: boolean;
        size?: number;
        createdAt?: string;
      }> = [];

      for (const file of storageObjects) {
        if (!file.name) continue;
        const fullPath = `${targetFolder}/${file.name}`;
        const { data: signedUrlData, error: signErr } = await supabase.storage
          .from('nexaweb-vault')
          .createSignedUrl(fullPath, 60 * 60);

        if (!signErr && signedUrlData?.signedUrl) {
          const isImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);
          const cleanDisplayName = file.name
            .replace(/^\d+[-_]/, '')
            .replace(/^[0-9a-fA-F-]{20,}[-_]/, '');

          formattedFiles.push({
            name: cleanDisplayName || file.name,
            path: fullPath,
            url: signedUrlData.signedUrl,
            isImage,
            size: file.metadata?.size,
            createdAt: file.created_at || undefined,
          });
        }
      }

      return res.status(200).json({
        success: true,
        files: formattedFiles,
      });
    } catch (filesErr) {
      console.error('Erro ao recuperar arquivos determinísticos do briefing:', filesErr);
      return res.status(200).json({
        success: true,
        files: [],
      });
    }
  }

  try {
    // 5. Busca os projetos reais existentes na tabela public.projects
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
