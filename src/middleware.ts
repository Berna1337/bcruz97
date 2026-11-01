import { defineMiddleware } from 'astro:middleware';
import { PREVIEW_COOKIE, previewConfigured, validPreviewSession } from './lib/preview-auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname.replace(/\/+$/, '');
  if (path !== '/preview' && !path.startsWith('/preview/')) return next();

  const protect = (response: Response) => {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'private, no-store, max-age=0');
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    headers.set('Referrer-Policy', 'same-origin');
    headers.append('Vary', 'Cookie');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  };
  if (context.url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(context.url.hostname)) {
    const secureURL = new URL(context.url);
    secureURL.protocol = 'https:';
    return protect(context.redirect(secureURL.href, 308));
  }
  const password = context.locals.runtime?.env.PREVIEW_PASSWORD;
  if (!previewConfigured(password)) {
    return protect(new Response('Private previews are not configured yet.', { status: 503 }));
  }
  if (!['GET', 'HEAD', 'POST'].includes(context.request.method)) {
    return protect(new Response('Method not allowed.', { status: 405, headers: { Allow: 'GET, HEAD, POST' } }));
  }
  if (context.request.method === 'POST' && context.request.headers.get('Origin') !== context.url.origin) {
    return protect(new Response('Please submit this form from the preview page.', { status: 403 }));
  }
  if (path === '/preview/login') {
    if (context.request.method === 'POST') {
      const limiter = context.locals.runtime.env.PREVIEW_LOGIN_LIMITER;
      if (!limiter) return protect(new Response('Private previews are not configured yet.', { status: 503 }));
      const key = `preview-login:${context.request.headers.get('CF-Connecting-IP') || 'local'}`;
      const { success } = await limiter.limit({ key });
      if (!success) return protect(new Response('Too many sign-in attempts. Try again in a minute.', { status: 429, headers: { 'Retry-After': '60' } }));
    }
    return protect(await next());
  }
  if (!await validPreviewSession(context.cookies.get(PREVIEW_COOKIE)?.value, password)) {
    return protect(context.redirect('/preview/login/', 303));
  }
  return protect(await next());
});
