import crypto from 'crypto';
import dotenv from 'dotenv';

// Garante carregamento de variáveis de ambiente em ambientes locais ou serverless
dotenv.config();

export function parseCookies(req: any): Record<string, string> {
  if (req?.cookies && typeof req.cookies === 'object') {
    return req.cookies;
  }
  const list: Record<string, string> = {};
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie;
  if (!cookieHeader || typeof cookieHeader !== 'string') return list;

  cookieHeader.split(';').forEach((cookie: string) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });
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
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias de validade
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

    const parts = token.split('.');
    if (parts.length !== 2) {
      return { authenticated: false };
    }

    const [payloadB64, signature] = parts;
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
  const isProd =
    process.env.NODE_ENV === 'production' ||
    req?.headers?.['x-forwarded-proto'] === 'https';

  const parts = [
    `nexaweb_admin_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${7 * 24 * 60 * 60}`,
  ];

  if (isProd) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function serializeLogoutCookie(req?: any): string {
  const isProd =
    process.env.NODE_ENV === 'production' ||
    req?.headers?.['x-forwarded-proto'] === 'https';

  const parts = [
    'nexaweb_admin_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];

  if (isProd) {
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
  if (typeof res.setHeader === 'function') {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
  } else if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
  }
}
