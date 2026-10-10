// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import { verifyClientSession, parseJsonBody } from './_portal-session.ts';

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const ALLOWED_CATEGORIES = [
  'Ajuste de Design',
  'Troca de Conteúdo',
  'Dúvida',
  'Correção',
  'Outro',
] as const;

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

  // Previne cache em respostas de mutação
  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }

  // 1. Aceitar somente método POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido. Utilize POST.',
    });
  }

  // 2. Validação estrita da sessão HTTP-only do cliente
  const session = verifyClientSession(req);
  if (!session.authenticated || !session.projectId) {
    return res.status(401).json({
      error: 'Sessão ausente ou inválida. Por favor, acesse novamente pela sua chave.',
    });
  }

  // 3. Validação de infraestrutura Supabase com Service Role
  if (!supabase) {
    return res.status(503).json({
      error: 'Supabase não está configurado no servidor.',
    });
  }

  try {
    const body = (req.body && typeof req.body === 'object')
      ? req.body
      : await parseJsonBody(req);

    const { title, description, category } = body || {};

    // 4. Validação de dados de entrada
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'Título da solicitação é obrigatório.',
      });
    }

    const cleanTitle = title.trim();
    if (cleanTitle.length < 3 || cleanTitle.length > 150) {
      return res.status(400).json({
        error: 'O título deve ter entre 3 e 150 caracteres.',
      });
    }

    if (typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        error: 'Descrição da solicitação é obrigatória.',
      });
    }

    const cleanDescription = description.trim();
    if (cleanDescription.length < 5 || cleanDescription.length > 3000) {
      return res.status(400).json({
        error: 'A descrição deve ter entre 5 e 3000 caracteres.',
      });
    }

    let validCategory = 'Ajuste de Design';
    if (typeof category === 'string' && ALLOWED_CATEGORIES.includes(category.trim() as any)) {
      validCategory = category.trim();
    } else if (category !== undefined && category !== null && category !== '') {
      return res.status(400).json({
        error: `Categoria inválida. Categorias permitidas: ${ALLOWED_CATEGORIES.join(', ')}.`,
      });
    }

    // 5. Inserção com projectId exclusivo e garantido da sessão (rejeita qualquer valor do cliente)
    const { data: request, error: insertError } = await supabase
      .from('client_requests')
      .insert({
        project_id: session.projectId,
        title: cleanTitle,
        description: cleanDescription,
        category: validCategory,
        status: 'Novo',
        priority: 'Normal',
        admin_reply: null,
        replied_at: null,
      })
      .select('id, category, title, description, status, priority, admin_reply, replied_at, created_at, updated_at')
      .single();

    if (insertError || !request) {
      console.error('Erro ao inserir solicitação na Área do Cliente:', insertError?.message);
      return res.status(500).json({
        error: 'Erro interno ao registrar a solicitação. Tente novamente em instantes.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Solicitação registrada com sucesso.',
      request,
    });
  } catch (error) {
    console.error('Erro ao processar criação de solicitação:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar sua solicitação.',
    });
  }
}
