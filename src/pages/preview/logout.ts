import type { APIRoute } from 'astro';
import { PREVIEW_COOKIE } from '../../lib/preview-auth';
export const prerender = false;
export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(PREVIEW_COOKIE, { path: '/preview' });
  return redirect('/preview/login/', 303);
};
