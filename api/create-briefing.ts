import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { hashToken } from './_portal-session.ts';

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

  if (!supabase) {
    return res.status(503).json({
      error: 'Supabase não está configurado no servidor.',
    });
  }

  try {
    const {
      clientName,
      businessName,
      clientEmail,
      clientPhone,
      clientNotes,
      plan,
      briefingSummary,
    } = req.body || {};

    if (!clientName || !businessName) {
      return res.status(400).json({
        error: 'Nome do cliente e nome do negócio são obrigatórios.',
      });
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: clientName,
        business_name: businessName,
        email: clientEmail || null,
        phone: clientPhone || null,
        notes: clientNotes || null,
      })
      .select()
      .single();

    if (clientError) {
      console.error('CREATE_BRIEFING_CLIENT_ERROR', {
        code: clientError.code,
        message: clientError.message,
        details: clientError.details,
        hint: clientError.hint,
      });
      console.error('Erro ao criar cliente:', clientError);

      return res.status(500).json({
        error: 'Não foi possível criar o cliente.',
      });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        client_id: client.id,
        name: businessName,
        plan: plan || null,
        status: 'Novo',
        current_stage: 'Briefing',
        progress_percent: 0,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Erro ao criar projeto:', projectError);

      return res.status(500).json({
        error: 'Não foi possível criar o projeto.',
      });
    }

    const { data: request, error: requestError } = await supabase
      .from('client_requests')
      .insert({
        project_id: project.id,
        title: `Briefing — ${businessName}`,
        category: 'Briefing',
        description: briefingSummary || null,
        status: 'Novo',
        priority: 'Normal',
      })
      .select()
      .single();

    if (requestError) {
      console.error('Erro ao criar solicitação:', requestError);

      return res.status(500).json({
        error: 'Não foi possível criar a solicitação.',
      });
    }

    // Gera token de acesso criptográfico de alta entropia para a Área do Cliente
    // caso ainda não exista acesso ativo para este projeto
    let accessToken: string | null = null;
    try {
      const { data: existingAccess } = await supabase
        .from('client_access')
        .select('id')
        .eq('project_id', project.id)
        .eq('is_active', true)
        .is('revoked_at', null)
        .maybeSingle();

      if (!existingAccess) {
        const rawToken = 'nwx_' + crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);

        const { data: newAccess, error: accessError } = await supabase
          .from('client_access')
          .insert({
            project_id: project.id,
            token_hash: tokenHash,
            is_active: true,
            access_count: 0,
          })
          .select('id')
          .single();

        if (!accessError && newAccess) {
          accessToken = rawToken;

          // Auditoria opcional em project_history (não fatal)
          try {
            await supabase.from('project_history').insert({
              project_id: project.id,
              action: 'ACCESS_GENERATED',
              details: {
                access_id: newAccess.id,
                origin: 'BRIEFING_SUBMISSION',
              },
            });
          } catch {
            // ignora erro de auditoria
          }
        }
      }
    } catch (tokenErr) {
      console.error('Erro ao gerar client_access inicial:', tokenErr);
    }

    const uploadSecret = process.env.NEXAWEB_UPLOAD_TICKET_SECRET;
    let uploadTicket: string | null = null;
    if (!uploadSecret || typeof uploadSecret !== 'string' || uploadSecret.trim() === '') {
      console.error('CONFIG_ERROR: NEXAWEB_UPLOAD_TICKET_SECRET não está configurada no servidor. uploadTicket não pôde ser gerado.');
    } else {
      const payload = Buffer.from(JSON.stringify({
        projectId: project.id,
        iat: Date.now(),
        exp: Date.now() + 15 * 60 * 1000,
        nonce: crypto.randomBytes(16).toString('hex'),
      })).toString('base64url');
      const signature = crypto.createHmac('sha256', uploadSecret).update(payload).digest('base64url');
      uploadTicket = `${payload}.${signature}`;
    }

    return res.status(200).json({
      success: true,
      clientId: client.id,
      projectId: project.id,
      requestId: request.id,
      accessToken,
      uploadTicket,
    });
  } catch (error) {
    console.error('Erro ao salvar briefing:', error);

    return res.status(500).json({
      error: 'Não foi possível salvar o briefing.',
    });
  }
  }
