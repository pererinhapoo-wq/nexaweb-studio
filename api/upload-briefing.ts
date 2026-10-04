import formidable from 'formidable';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
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
      error: 'Supabase Storage não está configurado no servidor.',
    });
  }

  try {
    const form = formidable({
      multiples: false,
      maxFileSize: 15 * 1024 * 1024,
    });

    const [, files] = await form.parse(req);

    const uploadedFile = Array.isArray(files.file)
      ? files.file[0]
      : files.file;

    if (!uploadedFile) {
      return res.status(400).json({
        error: 'Nenhum arquivo foi enviado.',
      });
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(uploadedFile.mimetype || '')) {
      return res.status(400).json({
        error: 'Apenas imagens JPG, PNG ou WEBP são permitidas.',
      });
    }

    const buffer = await fs.readFile(uploadedFile.filepath);

    const originalName = uploadedFile.originalFilename || 'imagem';
    const extension =
      originalName.includes('.')
        ? originalName.split('.').pop()
        : 'jpg';

    const pathname = `briefings/${Date.now()}-${cryptoRandomId()}.${extension}`;

    const { error } = await supabase.storage
      .from('nexaweb-vault')
      .upload(pathname, buffer, {
        contentType: uploadedFile.mimetype || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('Erro Supabase Storage:', error);

      return res.status(500).json({
        error: 'Não foi possível salvar a imagem no Supabase Storage.',
      });
    }

    return res.status(200).json({
      pathname,
      success: true,
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);

    return res.status(500).json({
      error: 'Não foi possível enviar a imagem.',
    });
  }
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
