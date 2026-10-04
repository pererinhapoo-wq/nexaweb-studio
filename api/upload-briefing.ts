import Busboy from 'busboy';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
      error: 'Supabase Storage não está configurado no servidor.',
    });
  }

  try {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        error: 'Formato de envio inválido.',
      });
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 15 * 1024 * 1024,
        files: 1,
      },
    });

    let fileBuffer: Buffer | null = null;
    let fileMimeType = '';
    let fileName = '';
    let fileTooLarge = false;
    let fileReceived = false;

    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      busboy.on(
        'file',
        (
          fieldname: string,
          file: NodeJS.ReadableStream,
          info: {
            filename: string;
            encoding: string;
            mimeType: string;
          }
        ) => {
          if (fieldname !== 'file') {
            file.resume();
            return;
          }

          fileReceived = true;
          fileName = info.filename || 'imagem';
          fileMimeType = info.mimeType || '';

          file.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          file.on('limit', () => {
            fileTooLarge = true;
          });
        }
      );

      busboy.on('finish', () => {
        try {
          fileBuffer = Buffer.concat(chunks);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      busboy.on('error', reject);

      req.pipe(busboy);
    });

    if (!fileReceived || !fileBuffer) {
      return res.status(400).json({
        error: 'Nenhum arquivo foi enviado.',
      });
    }

    if (fileTooLarge || fileBuffer.length > 15 * 1024 * 1024) {
      return res.status(413).json({
        error: 'O arquivo excede o limite de 15 MB.',
      });
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(fileMimeType)) {
      return res.status(400).json({
        error: 'Apenas imagens JPG, PNG ou WEBP são permitidas.',
      });
    }

    const extension = getExtension(fileName, fileMimeType);

    const pathname =
      `briefings/${Date.now()}-${cryptoRandomId()}.${extension}`;

    const { error } = await supabase.storage
      .from('nexaweb-vault')
      .upload(pathname, fileBuffer, {
        contentType: fileMimeType,
        upsert: false,
      });

    if (error) {
      console.error('Erro Supabase Storage:', error);

      return res.status(500).json({
        error: 'Não foi possível salvar a imagem no Supabase Storage.',
      });
    }

    return res.status(200).json({
      success: true,
      pathname,
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);

    return res.status(500).json({
      error: 'Não foi possível enviar a imagem.',
    });
  }
}

function cryptoRandomId() {
  return (
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

function getExtension(
  filename: string,
  mimeType: string
) {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);

  if (match?.[1]) {
    return match[1].toLowerCase();
  }

  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  return 'jpg';
                            }
