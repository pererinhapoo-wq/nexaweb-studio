import Busboy from 'busboy';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'nexaweb-vault';
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

type UploadedFile = {
  buffer: Buffer;
  filename: string;
  contentType: string;
};

function parseMultipartRequest(req: any): Promise<{
  file: UploadedFile | null;
}> {
  return new Promise((resolve, reject) => {
    const contentType =
      req.headers?.['content-type'] ||
      req.headers?.['Content-Type'] ||
      '';

    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      reject(new Error('A requisição não é multipart/form-data.'));
      return;
    }

    const bb = Busboy({
      headers: {
        'content-type': contentType,
      },
      limits: {
        files: 1,
        fileSize: MAX_FILE_SIZE,
      },
    });

    let fileData: UploadedFile | null = null;
    let fileTooLarge = false;

    bb.on(
      'file',
      (
        _fieldname: string,
        file: NodeJS.ReadableStream,
        info: {
          filename: string;
          encoding: string;
          mimeType: string;
        }
      ) => {
        const chunks: Buffer[] = [];

        file.on('data', (chunk: Buffer) => {
          chunks.push(Buffer.from(chunk));
        });

        file.on('limit', () => {
          fileTooLarge = true;
        });

        file.on('end', () => {
          fileData = {
            buffer: Buffer.concat(chunks),
            filename: info.filename || 'imagem',
            contentType: info.mimeType || 'application/octet-stream',
          };
        });
      }
    );

    bb.on('error', (error: Error) => {
      reject(error);
    });

    bb.on('finish', () => {
      if (fileTooLarge) {
        reject(new Error('A imagem não pode ter mais de 15 MB.'));
        return;
      }

      resolve({
        file: fileData,
      });
    });

    req.on('error', (error: Error) => {
      reject(error);
    });

    req.pipe(bb);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');

    return res.status(405).json({
      error: 'Método não permitido.',
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(503).json({
        error: 'Armazenamento do Supabase não configurado.',
      });
    }

    const { file } = await parseMultipartRequest(req);

    if (!file) {
      return res.status(400).json({
        error: 'Nenhum arquivo foi enviado.',
      });
    }

    if (!file.contentType.startsWith('image/')) {
      return res.status(400).json({
        error: 'Apenas imagens são permitidas.',
      });
    }

    if (file.buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: 'A imagem não pode ter mais de 15 MB.',
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

    const safeName = file.filename
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 150);

    const pathname =
      `briefings/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(pathname, file.buffer, {
        contentType: file.contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error(
        'Erro no upload para Supabase:',
        uploadError
      );

      return res.status(500).json({
        error: 'Não foi possível salvar a imagem.',
      });
    }

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
        error:
          'Imagem salva, mas não foi possível gerar a visualização.',
        pathname,
      });
    }

    return res.status(200).json({
      url: signedUrlData.signedUrl,
      pathname,
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível enviar a imagem.';

    if (message.includes('15 MB')) {
      return res.status(400).json({
        error: message,
      });
    }

    return res.status(500).json({
      error: 'Não foi possível enviar a imagem.',
    });
  }
}
