import Busboy from 'busboy';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { verifySession } from './_session.ts';

export const config = { api: { bodyParser: false } };

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req: any, res: any) {
  res.setHeader?.('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase Storage não está configurado no servidor.' });
  }

  // Identificação do tipo de upload antes do processamento do corpo multipart
  const queryProjectId = typeof req.query?.projectId === 'string' ? req.query.projectId.trim() : '';
  const adminUpload = !queryProjectId;

  // 1. Validação de segurança pré-stream para upload administrativo
  if (adminUpload && !verifySession(req).authenticated) {
    return res.status(401).json({ error: 'Sessão administrativa necessária.' });
  }

  // 2. Validação criptográfica do ticket HMAC ANTES de consumir qualquer byte do stream de arquivo
  if (!adminUpload) {
    if (!UUID_REGEX.test(queryProjectId)) {
      return res.status(400).json({ error: 'Identificador do projeto inválido ou ausente.' });
    }

    const ticket = typeof req.headers?.['x-nexaweb-upload-ticket'] === 'string'
      ? req.headers['x-nexaweb-upload-ticket'].trim()
      : '';
    const uploadSecret = process.env.NEXAWEB_UPLOAD_TICKET_SECRET;

    if (!ticket || !uploadSecret) {
      return res.status(401).json({ error: 'Autorização temporária de upload ausente. Atualize a versão do formulário.' });
    }

    const [payloadPart, signature] = ticket.split('.');
    if (!payloadPart || !signature) {
      return res.status(401).json({ error: 'Autorização temporária inválida.' });
    }

    const expected = crypto.createHmac('sha256', uploadSecret).update(payloadPart).digest('base64url');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'Autorização temporária inválida.' });
    }

    let payload: any;
    try {
      payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    } catch {
      return res.status(401).json({ error: 'Autorização temporária inválida.' });
    }

    if (
      payload?.projectId !== queryProjectId ||
      typeof payload.exp !== 'number' ||
      Date.now() > payload.exp ||
      typeof payload.nonce !== 'string'
    ) {
      return res.status(401).json({ error: 'Autorização temporária expirada ou incompatível com o projeto.' });
    }
  }

  const contentType = String(req.headers?.['content-type'] || '');
  if (!/^multipart\/form-data\s*;/i.test(contentType)) {
    return res.status(400).json({ error: 'Formato de envio inválido.' });
  }

  let projectId = queryProjectId;
  const chunks: Buffer[] = [];
  let bytes = 0;
  let fileCount = 0;
  let fileReceived = false;
  let tooLarge = false;
  let rejectedField = false;
  let mimeType = '';
  let settled = false;

  let parser: ReturnType<typeof Busboy>;
  try {
    parser = Busboy({
      headers: req.headers,
      limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 2, fieldNameSize: 64, fieldSize: 128 },
    });
  } catch {
    return res.status(400).json({ error: 'Formulário multipart inválido.' });
  }

  const parsed = new Promise<void>((resolve, reject) => {
    const fail = (err: Error) => { if (!settled) { settled = true; reject(err); } };
    parser.on('field', (name: string, value: string) => {
      if (name === 'projectId' && !adminUpload) {
        if (projectId && projectId !== value.trim()) rejectedField = true;
        else projectId = value.trim();
      } else if (name !== 'projectId') rejectedField = true;
    });
    parser.on('file', (field: string, stream: NodeJS.ReadableStream & { truncated?: boolean }, info: { mimeType: string }) => {
      fileCount += 1;
      if (field !== 'file' || fileCount > 1) {
        rejectedField = true;
        stream.resume();
        return;
      }
      fileReceived = true;
      mimeType = String(info.mimeType || '').toLowerCase();
      stream.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes <= MAX_FILE_BYTES) {
          chunks.push(chunk);
        } else {
          tooLarge = true;
          // Interrompe o acúmulo de dados na memória RAM e descarta o restante do stream
          stream.resume();
        }
      });
      stream.on('limit', () => {
        tooLarge = true;
        stream.resume();
      });
      stream.on('error', (err: Error) => fail(err));
    });
    parser.on('filesLimit', () => { rejectedField = true; });
    parser.on('fieldsLimit', () => { rejectedField = true; });
    parser.on('error', (err: Error) => fail(err));
    parser.on('finish', () => { if (!settled) { settled = true; resolve(); } });
    req.on('aborted', () => fail(new Error('Request aborted')));
    req.on('error', (err: Error) => fail(err));
    req.pipe(parser);
  });

  try {
    await parsed;
    if (rejectedField) return res.status(400).json({ error: 'Campos ou quantidade de arquivos inválidos.' });
    if (!fileReceived || bytes === 0) return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
    if (tooLarge || bytes > MAX_FILE_BYTES) return res.status(413).json({ error: 'O arquivo excede o limite de 15 MiB.' });

    const buffer = Buffer.concat(chunks, bytes);
    const detected = detectImage(buffer);
    if (!detected || detected.mime !== mimeType) {
      return res.status(400).json({ error: 'O conteúdo não corresponde a uma imagem JPG, PNG ou WEBP válida.' });
    }

    // --- FLUXO ADMINISTRATIVO (BUCKET PÚBLICO NEXAWEB-PUBLIC) ---
    // Imagens de portfólio são salvas no bucket público 'nexaweb-public' com URL pública permanente
    // sem expiração, preservando o bucket 'nexaweb-vault' estritamente privado para clientes.
    if (adminUpload) {
      const pathname = `admin-portfolio/${crypto.randomUUID()}.${detected.extension}`;
      const { error: uploadError } = await supabase.storage.from('nexaweb-public').upload(pathname, buffer, {
        contentType: detected.mime,
        upsert: false,
        cacheControl: '31536000',
      });
      if (uploadError) {
        console.error('ADMIN_PUBLIC_STORAGE_ERROR', uploadError.message);
        return res.status(500).json({ error: 'Não foi possível salvar a imagem no bucket público de portfólio.' });
      }

      const { data: publicData } = supabase.storage.from('nexaweb-public').getPublicUrl(pathname);
      const publicUrl = publicData?.publicUrl || '';

      if (!publicUrl) {
        await supabase.storage.from('nexaweb-public').remove([pathname]);
        return res.status(500).json({ error: 'A imagem foi salva, mas não foi possível gerar o link público permanente.' });
      }

      return res.status(200).json({ success: true, pathname, url: publicUrl });
    }

    // --- FLUXO PÚBLICO VINCULADO AO PROJETO ---
    const pathname = `briefings/${projectId}/${crypto.randomUUID()}.${detected.extension}`;

    // Reserva transacional com bloqueio FOR UPDATE no projeto
    const { data: reservation, error: reserveError } = await supabase.rpc('reserve_project_attachment', {
      p_project_id: projectId,
      p_storage_path: pathname,
      p_mime_type: detected.mime,
      p_size_bytes: bytes,
    });

    if (reserveError) {
      console.error('UPLOAD_RESERVE_RPC_ERROR', reserveError.message || reserveError);
      return res.status(500).json({ error: 'Erro ao validar cotas do projeto.' });
    }

    if (!reservation?.ok) {
      const reason = reservation?.reason;
      if (reason === 'FILE_COUNT') {
        return res.status(400).json({ error: 'Limite de 5 arquivos por projeto atingido.' });
      }
      if (reason === 'PROJECT_QUOTA') {
        return res.status(413).json({ error: 'Limite total de 50 MiB por projeto excedido.' });
      }
      if (reason === 'PROJECT_NOT_FOUND') {
        return res.status(404).json({ error: 'Projeto associado não encontrado.' });
      }
      if (reason === 'FILE_SIZE') {
        return res.status(413).json({ error: 'O arquivo excede o limite de 15 MiB.' });
      }
      if (reason === 'MIME') {
        return res.status(400).json({ error: 'Tipo de imagem não permitido.' });
      }
      return res.status(400).json({ error: 'Não foi possível autorizar a reserva do anexo.' });
    }

    const attachmentId = reservation.attachment_id;

    // Upload seguro no Supabase Storage
    const { error: uploadError } = await supabase.storage.from('nexaweb-vault').upload(pathname, buffer, {
      contentType: detected.mime,
      upsert: false,
      cacheControl: '3600',
    });

    if (uploadError) {
      console.error('UPLOAD_STORAGE_ERROR', uploadError.message);
      try {
        await supabase.rpc('release_project_attachment', {
          p_attachment_id: attachmentId,
          p_reason: `STORAGE_UPLOAD_ERROR: ${uploadError.message}`,
          p_failed_storage: false,
        });
      } catch (releaseErr) {
        console.error('RELEASE_ATTACHMENT_ERROR', releaseErr);
      }
      return res.status(500).json({ error: 'Não foi possível salvar a imagem no armazenamento seguro.' });
    }

    // Confirmação idempotente da reserva
    const { data: finishResult, error: finishError } = await supabase.rpc('finish_project_attachment', {
      p_attachment_id: attachmentId,
    });

    if (finishError || !finishResult?.ok) {
      console.error('UPLOAD_FINISH_RPC_ERROR', finishError?.message || finishResult?.reason);

      let storageRemovalFailed = false;
      try {
        const { error: removeErr } = await supabase.storage.from('nexaweb-vault').remove([pathname]);
        if (removeErr) storageRemovalFailed = true;
      } catch (err) {
        storageRemovalFailed = true;
        console.error('ORPHAN_CLEANUP_STORAGE_ERROR', err);
      }

      // Se a remoção no Storage falhar, marca como DELETION_FAILED para o sweeper poder limpá-lo depois
      try {
        await supabase.rpc('release_project_attachment', {
          p_attachment_id: attachmentId,
          p_reason: storageRemovalFailed ? 'STORAGE_REMOVAL_FAILED' : 'CONFIRMATION_FAILED',
          p_failed_storage: storageRemovalFailed,
        });
      } catch (releaseErr) {
        console.error('RELEASE_ATTACHMENT_ERROR', releaseErr);
      }

      return res.status(500).json({ error: 'Não foi possível confirmar o anexo. O arquivo foi tratado com segurança.' });
    }

    return res.status(200).json({ success: true, pathname, attachmentId });
  } catch (error) {
    console.error('UPLOAD_BRIEFING_ERROR', error instanceof Error ? error.message : 'unknown');
    if (!res.headersSent) return res.status(400).json({ error: 'Envio interrompido ou formulário inválido. Tente novamente.' });
  }
}

function detectImage(buffer: Buffer): { mime: string; extension: string } | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: 'jpg' };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: 'image/png', extension: 'png' };
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { mime: 'image/webp', extension: 'webp' };
  }
  return null;
}
