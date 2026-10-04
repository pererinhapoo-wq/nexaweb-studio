import crypto from 'crypto';
import dotenv from 'dotenv';
import { isRequestSecure, parseCookies, parseJsonBody } from './_session.ts';

dotenv.config();

/**
 * Duração segura da sessão do cliente na Área do Cliente: 30 dias (em segundos)
 */
export const CLIENT_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 2592000 segundos

export const CLIENT_COOKIE_NAME = 'nexaweb_client_session';

export interface ClientSessionPayload {
  projectId: string;
  accessId: string;
  iat: number;
  exp: number;
}

/**
 * Gera o hash SHA-256 de um token bruto para consulta segura em client_access.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Cria um token de sessão assinado com HMAC-SHA256 utilizando exclusivamente
 * o segredo dedicado NEXAWEB_CLIENT_SESSION_SECRET.
 */
export function createClientSessionToken(data: {
  projectId: string;
  accessId: string;
}): string | null {
  const secret = process.env.NEXAWEB_CLIENT_SESSION_SECRET;
  if (!secret) return null;

  const now = Date.now();
  const payload: ClientSessionPayload = {
    projectId: data.projectId,
    accessId: data.accessId,
    iat: now,
    exp: now + CLIENT_SESSION_MAX_AGE * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Valida a sessão do cliente a partir dos cookies da requisição.
 * Retorna os identificadores seguros associados caso a assinatura e expiração sejam válidas.
 */
export function verifyClientSession(req: any): {
  authenticated: boolean;
  projectId?: string;
  accessId?: string;
} {
  try {
    const secret = process.env.NEXAWEB_CLIENT_SESSION_SECRET;
    if (!secret) {
      return { authenticated: false };
    }

    const cookies = parseCookies(req);
    const token = cookies[CLIENT_COOKIE_NAME];
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
    const payload: ClientSessionPayload = JSON.parse(payloadJson);

    if (
      !payload.projectId ||
      !payload.accessId ||
      typeof payload.exp !== 'number' ||
      Date.now() > payload.exp
    ) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      projectId: payload.projectId,
      accessId: payload.accessId,
    };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Serializa o cookie nexaweb_client_session com as diretivas de segurança adequadas.
 */
export function serializeClientSessionCookie(token: string, req?: any): string {
  const secure = isRequestSecure(req);
  const expires = new Date(Date.now() + CLIENT_SESSION_MAX_AGE * 1000).toUTCString();

  const parts = [
    `${CLIENT_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${CLIENT_SESSION_MAX_AGE}`,
    `Expires=${expires}`,
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

/**
 * Serializa o cookie de logout para encerrar a sessão do cliente.
 */
export function serializeClientLogoutCookie(req?: any): string {
  const secure = isRequestSecure(req);

  const parts = [
    `${CLIENT_COOKIE_NAME}=`,
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

export { isRequestSecure, parseCookies, parseJsonBody };
