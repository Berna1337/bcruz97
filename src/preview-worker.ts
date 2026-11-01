import { createPreviewSession, passwordMatches, previewConfigured, readPreviewPassword, PREVIEW_SESSION_SECONDS, validPreviewSession } from './lib/preview-auth.ts';

interface PreviewEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  PREVIEW_PASSWORD?: string;
  PREVIEW_LOGIN_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}
const cookieName = 'bcruz97_preview_site';
function protect(response: Response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('Referrer-Policy', 'same-origin');
  headers.append('Vary', 'Cookie');
  return new Response(response.body, { status: response.status, headers });
}
function redirect(destination: string, cookie?: string) {
  return protect(new Response(null, { status: 303, headers: { Location: destination, ...(cookie ? { 'Set-Cookie': cookie } : {}) } }));
}
function login(failed = false) {
  return protect(new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>Preview — bcruz97</title><style>:root{color-scheme:light dark}body{max-width:420px;margin:15vh auto;padding:24px;font:17px/1.6 system-ui}h1{font-family:Georgia,serif;font-weight:400}label,input,button{display:block}input{box-sizing:border-box;width:100%;padding:12px;margin:8px 0 20px;font:inherit}button{padding:10px 24px;font:inherit;cursor:pointer}@media(prefers-color-scheme:dark){body{background:#000;color:#ddd}}</style></head><body><p>bcruz97 · Private preview</p><h1>A look before publishing.</h1><p>Sign in to browse the blog, including drafts.</p><form method="post" action="/preview/login/"><label for="password">Preview password</label><input id="password" type="password" name="password" autocomplete="current-password" required maxlength="1024">${failed ? '<p role="alert">That password didn’t match. Try again.</p>' : ''}<button>Sign in</button></form></body></html>`, { status: failed ? 401 : 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" } }));
}
export default {
  async fetch(request: Request, env: PreviewEnv): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      url.protocol = 'https:';
      return protect(Response.redirect(url.href, 308));
    }
    if (!previewConfigured(env.PREVIEW_PASSWORD) || !env.PREVIEW_LOGIN_LIMITER) return protect(new Response('Private previews are not configured yet.', { status: 503 }));
    if (!['GET', 'HEAD', 'POST'].includes(request.method)) return protect(new Response('Method not allowed.', { status: 405 }));
    if (request.method === 'POST' && request.headers.get('Origin') !== url.origin) return protect(new Response('Please submit this form from the preview site.', { status: 403 }));
    const secure = url.protocol === 'https:' ? '; Secure' : '';
    if (path === '/preview/login') {
      if (request.method !== 'POST') return request.method === 'HEAD' ? protect(new Response(null)) : login();
      const { success } = await env.PREVIEW_LOGIN_LIMITER.limit({ key: `preview-login:${request.headers.get('CF-Connecting-IP') || 'local'}` });
      if (!success) return protect(new Response('Too many sign-in attempts. Try again in a minute.', { status: 429, headers: { 'Retry-After': '60' } }));
      const supplied = await readPreviewPassword(request);
      if (supplied === null || !await passwordMatches(supplied, env.PREVIEW_PASSWORD)) return login(true);
      return redirect('/', `${cookieName}=${await createPreviewSession(env.PREVIEW_PASSWORD)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${PREVIEW_SESSION_SECONDS}${secure}`);
    }
    if (path === '/preview/logout' && request.method === 'POST') return redirect('/preview/login/', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
    const cookie = request.headers.get('Cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!await validPreviewSession(cookie, env.PREVIEW_PASSWORD)) return redirect('/preview/login/');
    if (request.method === 'POST') return protect(new Response('Method not allowed.', { status: 405 }));
    if (path === '/preview') return redirect('/');
    // Every request, including images, audio, RSS and HTML files, passes this gate.
    return protect(await env.ASSETS.fetch(request));
  },
};
