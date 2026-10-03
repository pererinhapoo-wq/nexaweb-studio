import { verifySession, sendJson } from './_session.ts';

export default async function handler(req: any, res: any) {
  // Retorna apenas { authenticated: true } ou { authenticated: false }
  const result = verifySession(req);
  return sendJson(res, 200, { authenticated: Boolean(result.authenticated) });
}
