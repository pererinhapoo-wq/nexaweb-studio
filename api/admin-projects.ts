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
  // 1. Métodos permitidos: GET para listagens e POST para ações administrativas seguras
  if (req.method !== 'GET' && req.method !== 'POST') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'GET, POST');
    }
    return res.status(405).json({
      error: 'Método não permitido. Utilize GET ou POST.',
    });
  }

  // 2. Proteção de autenticação administrativa reutilizando o padrão seguro do projeto
  const session = verifySession(req);
  if (!session.authenticated) {
    return res.status(401).json({
      error: 'Não autorizado. Sessão administrativa necessária.',
    });
  }

  // Proteção rigorosa contra CSRF para ações via POST
  if (req.method === 'POST') {
    const secFetchSite = req.headers?.['sec-fetch-site'];
    const xRequestedWith = req.headers?.['x-requested-with'];
    const customAction = req.headers?.['x-admin-action'];

    const isSameOrigin = secFetchSite === 'same-origin' || secFetchSite === 'none';
    const hasSecureHeader =
      xRequestedWith === 'XMLHttpRequest' ||
      customAction === 'quarantine-action' ||
      customAction === 'quarantine-retry' ||
      customAction === 'quarantine-dismiss';

    if (!isSameOrigin && !hasSecureHeader) {
      return res.status(403).json({
        error: 'Requisição bloqueada por proteção contra CSRF. Requer mesma origem ou cabeçalho seguro.',
      });
    }
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

  // Parser seguro do corpo para requisições POST
  let bodyData: any = req.body;
  if (typeof bodyData === 'string') {
    try {
      bodyData = JSON.parse(bodyData);
    } catch {
      bodyData = {};
    }
  } else if (!bodyData && req.method === 'POST' && typeof req.on === 'function') {
    try {
      const rawText = await new Promise<string>((resolve) => {
        let acc = '';
        req.on('data', (c: any) => (acc += c));
        req.on('end', () => resolve(acc));
      });
      bodyData = rawText ? JSON.parse(rawText) : {};
    } catch {
      bodyData = {};
    }
  }

  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // 4. Ações de Recuperação Administrativa de Quarentena (POST)
  if (req.method === 'POST') {
    const action = (queryParams.action || bodyData?.action || '').toLowerCase();

    // 4.1 Retry administrativo de anexo em quarentena
    if (action === 'quarantine-retry') {
      const attachmentId = (bodyData?.attachmentId || queryParams.attachmentId || '').trim();
      if (!attachmentId || !UUID_REGEX.test(attachmentId)) {
        return res.status(400).json({ error: 'Identificador de anexo inválido ou ausente.' });
      }

      try {
        const { data: retryRes, error: retryErr } = await supabase.rpc(
          'admin_retry_quarantined_attachment',
          { p_attachment_id: attachmentId }
        );

        if (retryErr || !retryRes?.ok) {
          const reason = retryErr?.message || retryRes?.reason || 'Falha ao reenfileirar anexo.';
          return res.status(400).json({ error: reason });
        }

        return res.status(200).json({
          success: true,
          message: 'Anexo reenfileirado para nova tentativa de limpeza com histórico preservado.',
        });
      } catch (err: any) {
        return res.status(500).json({ error: err?.message || 'Erro inesperado no retry administrativo.' });
      }
    }

    // 4.2 Dismiss administrativo com justificativa e remoção física prévia
    if (action === 'quarantine-dismiss') {
      const attachmentId = (bodyData?.attachmentId || queryParams.attachmentId || '').trim();
      const justification = (bodyData?.justification || '').trim();

      if (!attachmentId || !UUID_REGEX.test(attachmentId)) {
        return res.status(400).json({ error: 'Identificador de anexo inválido ou ausente.' });
      }
      if (!justification || justification.length < 5) {
        return res.status(400).json({
          error: 'Justificativa de auditoria obrigatória (mínimo de 5 caracteres).',
        });
      }

      try {
        // Consulta registro para validação de posse e lease
        const { data: attRec, error: fetchErr } = await supabase
          .from('project_attachments')
          .select('id, storage_path, cleanup_attempts, cleanup_lease_expires_at, state')
          .eq('id', attachmentId)
          .single();

        if (fetchErr || !attRec) {
          return res.status(404).json({ error: 'Anexo não encontrado.' });
        }
        if (attRec.cleanup_attempts < 10) {
          return res.status(400).json({
            error: 'O anexo não está em quarentena (requer ao menos 10 tentativas de limpeza).',
          });
        }
        if (attRec.cleanup_lease_expires_at && new Date(attRec.cleanup_lease_expires_at) > new Date()) {
          return res.status(409).json({
            error: 'O anexo possui lease ativo por worker em execução. Aguarde a expiração do lease.',
          });
        }

        // Tenta remover o arquivo físico no Storage primeiro
        let storageRemoved = false;
        let storageErrorMsg: string | null = null;
        try {
          const { error: removeErr } = await supabase.storage
            .from('nexaweb-vault')
            .remove([attRec.storage_path]);

          if (removeErr) {
            storageErrorMsg = removeErr.message;
          } else {
            storageRemoved = true;
          }
        } catch (storageEx: any) {
          storageErrorMsg = storageEx?.message || 'Exceção na remoção do Storage';
        }

        // Se houve erro no Storage, não finaliza como DELETED e mantém rastreável
        if (!storageRemoved && storageErrorMsg) {
          console.error('ADMIN_DISMISS_STORAGE_FAILED', {
            path: attRec.storage_path,
            error: storageErrorMsg,
          });
          return res.status(500).json({
            error: `Falha na remoção física no Storage: ${storageErrorMsg}. O item foi mantido em quarentena para auditoria.`,
          });
        }

        // Confirmação auditada no banco via RPC
        const { data: dismissRes, error: dismissErr } = await supabase.rpc(
          'admin_dismiss_quarantined_attachment',
          {
            p_attachment_id: attachmentId,
            p_justification: justification,
          }
        );

        if (dismissErr || !dismissRes?.ok) {
          console.error('ADMIN_DISMISS_RPC_FAILED', dismissErr || dismissRes);
          return res.status(500).json({
            error: `Arquivo removido do Storage, mas falha ao atualizar banco: ${dismissErr?.message || dismissRes?.reason}`,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Anexo dispensado com sucesso e justificativa auditada.',
        });
      } catch (err: any) {
        return res.status(500).json({ error: err?.message || 'Erro inesperado no expurgo administrativo.' });
      }
    }

    return res.status(400).json({ error: 'Ação POST administrativa não reconhecida.' });
  }

  // 5. Ação: URL assinada de inspeção administrativa para anexo em quarentena (TTL estrito de 60s)
  if (queryParams.action === 'quarantine-signed-url') {
    const path = (queryParams.path || '').trim();
    if (!path || !path.startsWith('briefings/')) {
      return res.status(400).json({ error: 'Caminho de anexo inválido.' });
    }
    const { data: signedData, error: signErr } = await supabase.storage
      .from('nexaweb-vault')
      .createSignedUrl(path, 60); // TTL máximo de 60 segundos para proteção de anexos privados

    if (signErr || !signedData?.signedUrl) {
      return res.status(500).json({ error: 'Erro ao gerar URL assinada de inspeção.' });
    }
    return res.status(200).json({ success: true, url: signedData.signedUrl });
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

      // 4. Gera URLs assinadas temporárias válidas por 60 segundos exclusivamente para os arquivos da pasta
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
          .createSignedUrl(fullPath, 60); // 60 segundos estrito para proteção de anexos privados

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

  // 5. Ação: Listar anexos em quarentena de limpeza (cleanup_attempts >= 10) para revisão administrativa segura
  if (queryParams.action === 'cleanup-quarantine') {
    try {
      const { data: quarantinedList, error: qErr } = await supabase.rpc('get_quarantined_attachments', {
        p_min_attempts: 10,
        p_limit: 50,
      });

      if (qErr) {
        const { data: fallbackList } = await supabase
          .from('project_attachments')
          .select('id, project_id, storage_path, mime_type, size_bytes, state, cleanup_attempts, last_cleanup_error, created_at, updated_at')
          .gte('cleanup_attempts', 10)
          .order('updated_at', { ascending: false })
          .limit(50);
        return res.status(200).json({
          success: true,
          quarantined: fallbackList || [],
        });
      }

      return res.status(200).json({
        success: true,
        quarantined: quarantinedList || [],
      });
    } catch {
      return res.status(200).json({ success: true, quarantined: [] });
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
