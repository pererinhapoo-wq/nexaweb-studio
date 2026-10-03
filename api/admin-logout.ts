import { serializeLogoutCookie, sendJson } from './_session.ts';

export default async function handler(req: any, res: any) {
  const cookie = serializeLogoutCookie(req);
  res.setHeader?.('Set-Cookie', cookie);
  return sendJson(res, 200, { authenticated: false, success: true });
}
