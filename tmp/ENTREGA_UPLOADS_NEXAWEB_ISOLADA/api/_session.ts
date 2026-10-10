import crypto from 'crypto';
import dotenv from 'dotenv';

// Garante carregamento de variáveis de ambiente em ambientes locais ou serverless
dotenv.config();

/**
 * Duração segura da sessão administrativa: 24 horas (em segundos)
 */
export const SESSION_MAX_AGE = 24 * 60 * 60; // 86400 segundos

/**
 * Detecta se a conexão atual é segura (HTTPS), considerando proxies reversos
 * e provedores serverless como Vercel, Cloud Run e ambientes de produção.
 */
export function isRequestSecure(req?: any): boolean {
  if (req?.connection?.encrypted || req?.socket?.encrypted) {
    return true;
  }
  const proto = req?.headers?.['x-forwarded-proto'];
  if (typeof proto === 'string') {
    const first = proto.split(',')[0].trim().toLowerCase();
    if (first === 'https') return true;
  }
  if (req?.headers?.['x-forwarded-ssl'] === 'on') {
    return true;
  }
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production') {
    return true;
  }
  const host = req?.headers?.host || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  if (process.env.NODE_ENV === 'production' && !isLocal) {
    return true;
  }
  return false;
}

/**
 * Analisa cookies de forma resiliente tanto para Node.js nativo (Vite/Connect)
 * quanto para ambientes serverless (Vercel/Next.js/Express).
 */
export function parseCookies(req: any): Record<string, string> {
  const list: Record<string, string> = {};

  // 1. Incorpora cookies já pré-analisados pelo framework se presentes
  if (req?.cookies && typeof req.cookies === 'object') {
    Object.assign(list, req.cookies);
  }

  // 2. Analisa o cabeçalho bruto Cookie (evita perda de cookies customizados)
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie;
  if (cookieHeader && typeof cookieHeader === 'string') {
    cookieHeader.split(';').forEach((pair: string) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return;
      const name = pair.slice(0, idx).trim();
      const rawVal = pair.slice(idx + 1).trim();
      if (!name) return;
      const cleanVal = rawVal.replace(/^"|"$/g, '');
      try {
        list[name] = decodeURIComponent(cleanVal);
      } catch {
        list[name] = cleanVal;
      }
    });
  }

  return list;
}

export async function parseJsonBody(req: any): Promise<any> {
  if (req?.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req?.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    if (!req || typeof req.on !== 'function') {
      return resolve({});
    }
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export function verifyPassword(password: unknown): { status: number; error?: string } {
  const adminPassword = process.env.NEXAWEB_ADMIN_PASSWORD;
  const sessionSecret = process.env.NEXAWEB_ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    return {
      status: 503,
      error: 'Autenticação administrativa não configurada.',
    };
  }

  if (typeof password !== 'string' || !password) {
    return {
      status: 401,
      error: 'Senha incorreta.',
    };
  }

  const inputBuffer = Buffer.from(password, 'utf8');
  const adminBuffer = Buffer.from(adminPassword, 'utf8');

  const isMatch =
    inputBuffer.length === adminBuffer.length &&
    crypto.timingSafeEqual(inputBuffer, adminBuffer);

  if (!isMatch) {
    return {
      status: 401,
      error: 'Senha incorreta.',
    };
  }

  return { status: 200 };
}

export function createSessionToken(): string | null {
  const secret = process.env.NEXAWEB_ADMIN_SESSION_SECRET;
  if (!secret) return null;

  const payload = {
    auth: true,
    iat: Date.now(),
    exp: Date.now() + SESSION_MAX_AGE * 1000, // 24 horas de validade contínua
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export function verifySession(req: any): { authenticated: boolean } {
  try {
    const secret = process.env.NEXAWEB_ADMIN_SESSION_SECRET;
    if (!secret) {
      return { authenticated: false };
    }

    const cookies = parseCookies(req);
    const token = cookies['nexaweb_admin_session'];
    if (!token || typeof token !== 'string') {
      return { authenticated: false };
    }

    const dotIndex = token.indexOf('.');
    if (dotIndex === -1) {
      return { authenticated: false };
    }

    const payloadB64 = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);
    if (!payloadB64 || !signature) {
      return { authenticated: false };
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    const sigBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { authenticated: false };
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    if (
      payload.auth !== true ||
      typeof payload.exp !== 'number' ||
      Date.now() > payload.exp
    ) {
      return { authenticated: false };
    }

    return { authenticated: true };
  } catch {
    return { authenticated: false };
  }
}

export function serializeSessionCookie(token: string, req?: any): string {
  const secure = isRequestSecure(req);
  const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000).toUTCString();

  const parts = [
    `nexaweb_admin_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE}`,
    `Expires=${expires}`,
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function serializeLogoutCookie(req?: any): string {
  const secure = isRequestSecure(req);

  const parts = [
    'nexaweb_admin_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function sendJson(
  res: any,
  statusCode: number,
  data: any,
  headers: Record<string, string | string[]> = {}
) {
  // Configura todos os cabeçalhos fornecidos
  if (typeof res.setHeader === 'function') {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.setHeader('Content-Type', 'application/json');
  }

  // Compatibilidade com frameworks (Vercel Serverless, Express)
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
    return;
  }

  // Fallback nativo Node.js (Vite middleware / http.ServerResponse)
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}
