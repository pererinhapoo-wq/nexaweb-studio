import { createClient } from '@supabase/supabase-js';

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

    return res.status(200).json({
      success: true,
      clientId: client.id,
      projectId: project.id,
      requestId: request.id,
    });
  } catch (error) {
    console.error('Erro ao salvar briefing:', error);

    return res.status(500).json({
      error: 'Não foi possível salvar o briefing.',
    });
  }
  }
