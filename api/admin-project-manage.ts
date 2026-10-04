// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import { verifySession, parseJsonBody } from './_session';

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

    const {
      projectId,
      progressPercent,
      currentStage,
      headlineMessage,
      stagingUrl,
      productionUrl,
      status,
      newUpdate,
    } = body || {};

    if (typeof projectId !== 'string' || !projectId.trim()) {
      return res.status(400).json({
        error: 'ID do projeto é obrigatório.',
      });
    }

    const cleanProjectId = projectId.trim();

    // 3. Verificação de existência do projeto no banco
    const { data: currentProject, error: fetchError } = await supabase
      .from('projects')
      .select('id, progress_percent, current_stage, headline_message, staging_url, production_url, status')
      .eq('id', cleanProjectId)
      .single();

    if (fetchError || !currentProject) {
      return res.status(404).json({
        error: 'Projeto não encontrado.',
      });
    }

    // 4. Validação e montagem estrita dos campos autorizados
    const updatesToApply: Record<string, any> = {};

    if (progressPercent !== undefined) {
      const parsedProgress = Number(progressPercent);
      if (
        typeof progressPercent !== 'number' ||
        Number.isNaN(parsedProgress) ||
        parsedProgress < 0 ||
        parsedProgress > 100
      ) {
        return res.status(400).json({
          error: 'Progresso deve ser um número entre 0 e 100.',
        });
      }
      updatesToApply.progress_percent = Math.round(parsedProgress);
    }

    if (currentStage !== undefined) {
      if (typeof currentStage !== 'string') {
        return res.status(400).json({
          error: 'Etapa atual deve ser um texto.',
        });
      }
      updatesToApply.current_stage = currentStage.trim();
    }

    if (headlineMessage !== undefined) {
      if (typeof headlineMessage !== 'string') {
        return res.status(400).json({
          error: 'Mensagem de destaque deve ser um texto.',
        });
      }
      updatesToApply.headline_message = headlineMessage.trim();
    }

    if (stagingUrl !== undefined) {
      if (stagingUrl !== null && typeof stagingUrl !== 'string') {
        return res.status(400).json({
          error: 'URL de teste (staging) inválida.',
        });
      }
      updatesToApply.staging_url = typeof stagingUrl === 'string' ? stagingUrl.trim() : null;
    }

    if (productionUrl !== undefined) {
      if (productionUrl !== null && typeof productionUrl !== 'string') {
        return res.status(400).json({
          error: 'URL de produção inválida.',
        });
      }
      updatesToApply.production_url = typeof productionUrl === 'string' ? productionUrl.trim() : null;
    }

    if (status !== undefined) {
      if (typeof status !== 'string' || !status.trim()) {
        return res.status(400).json({
          error: 'Status deve ser um texto não vazio.',
        });
      }
      updatesToApply.status = status.trim();
    }

    // 5. Aplicação das alterações em projects caso haja campos a atualizar
    if (Object.keys(updatesToApply).length > 0) {
      updatesToApply.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('projects')
        .update(updatesToApply)
        .eq('id', cleanProjectId);

      if (updateError) {
        return res.status(500).json({
          error: 'Erro ao atualizar dados do projeto.',
        });
      }

      // 6. Auditoria de eventos específicos em project_history
      try {
        const historyInserts: Array<{ project_id: string; action: string; details: any }> = [];

        // Alteração de progresso
        if (
          updatesToApply.progress_percent !== undefined &&
          updatesToApply.progress_percent !== currentProject.progress_percent
        ) {
          historyInserts.push({
            project_id: cleanProjectId,
            action: 'PROGRESS_UPDATED',
            details: {
              from: currentProject.progress_percent,
              to: updatesToApply.progress_percent,
            },
          });
        }

        // Alteração de etapa
        if (
          updatesToApply.current_stage !== undefined &&
          updatesToApply.current_stage !== currentProject.current_stage
        ) {
          historyInserts.push({
            project_id: cleanProjectId,
            action: 'STAGE_CHANGED',
            details: {
              from: currentProject.current_stage,
              to: updatesToApply.current_stage,
            },
          });
        }

        // Publicação/alteração de mensagem de destaque
        if (
          updatesToApply.headline_message !== undefined &&
          updatesToApply.headline_message !== currentProject.headline_message
        ) {
          historyInserts.push({
            project_id: cleanProjectId,
            action: 'UPDATE_PUBLISHED',
            details: {
              message: updatesToApply.headline_message,
            },
          });
        }

        if (historyInserts.length > 0) {
          await supabase.from('project_history').insert(historyInserts);
        }
      } catch (histErr) {
        console.error('Erro não fatal ao registrar auditoria em project_history:', histErr);
      }
    }

    // 7. Inclusão de registro em project_updates se solicitado pelo Admin
    if (newUpdate && typeof newUpdate === 'object') {
      const { title, message, stage, progressSnapshot, visibleToClient } = newUpdate;

      if (typeof title === 'string' && title.trim() && typeof message === 'string' && message.trim()) {
        try {
          const finalStage = stage
            ? String(stage).trim()
            : (updatesToApply.current_stage ?? currentProject.current_stage ?? null);

          const finalProgress = typeof progressSnapshot === 'number'
            ? Math.round(progressSnapshot)
            : (updatesToApply.progress_percent ?? currentProject.progress_percent ?? null);

          await supabase.from('project_updates').insert({
            project_id: cleanProjectId,
            title: title.trim(),
            message: message.trim(),
            stage: finalStage,
            progress_snapshot: finalProgress,
            visible_to_client: visibleToClient !== false,
          });
        } catch (updateErr) {
          console.error('Erro não fatal ao criar post em project_updates:', updateErr);
        }
      }
    }

    return res.status(200).json({
      success: true,
      projectId: cleanProjectId,
      updatedFields: Object.keys(updatesToApply).filter((k) => k !== 'updated_at'),
    });
  } catch (error) {
    console.error('Erro na gestão do projeto:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar atualização do projeto.',
    });
  }
}
