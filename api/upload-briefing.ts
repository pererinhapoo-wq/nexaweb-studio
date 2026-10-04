import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET_NAME = 'nexaweb-vault';
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');

    return res.status?.(405).json
      ? res.status(405).json({ error: 'Método não permitido.' })
      : Response.json({ error: 'Método não permitido.' }, { status: 405 });
  }

  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(503).json({
        error: 'Armazenamento do Supabase não configurado.',
      });
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return res.status(400).json({
        error: 'Nenhum arquivo foi enviado.',
      });
    }

    if (!file.type.startsWith('image/')) {
      return res.status(400).json({
        error: 'Apenas imagens são permitidas.',
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: 'A imagem não pode ter mais de 15 MB.',
      });
    }

    const originalName = file.name || 'imagem';
    const safeName = originalName
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 150);

    const pathname = `briefings/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(pathname, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Erro no upload para Supabase:', uploadError);

      return res.status(500).json({
        error: 'Não foi possível salvar a imagem.',
      });
    }

    // O bucket é privado.
    // Criamos uma URL temporária apenas para a visualização imediata.
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(pathname, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(
        'Erro ao criar URL temporária:',
        signedUrlError
      );

      return res.status(500).json({
        error: 'Imagem salva, mas não foi possível gerar a visualização.',
        pathname,
      });
    }

    return res.status(200).json({
      url: signedUrlData.signedUrl,
      pathname,
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);

    return res.status(500).json({
      error: 'Não foi possível enviar a imagem.',
    });
  }
        }
