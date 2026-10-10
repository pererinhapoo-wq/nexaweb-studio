import {
  parseJsonBody,
  verifyPassword,
  createSessionToken,
  serializeSessionCookie,
  sendJson,
} from './_session.ts';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  try {
    const body = await parseJsonBody(req);
    const password = body?.password;

    const verification = verifyPassword(password);
    if (verification.status !== 200) {
      return sendJson(
        res,
        verification.status,
        {
          error: verification.error || 'Não foi possível verificar a autenticação.',
        },
        {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      );
    }

    const token = createSessionToken();
    if (!token) {
      return sendJson(
        res,
        503,
        {
          error: 'Autenticação administrativa não configurada.',
        },
        {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      );
    }

    const cookie = serializeSessionCookie(token, req);
    res.setHeader?.('Set-Cookie', cookie);

    return sendJson(
      res,
      200,
      { authenticated: true },
      {
        'Set-Cookie': cookie,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
      }
    );
  } catch (error) {
    return sendJson(
      res,
      500,
      {
        error: 'Não foi possível verificar a autenticação.',
      },
      {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    );
  }
}
