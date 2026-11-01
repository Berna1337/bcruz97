import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/preview-worker.ts';
const password = 'local-only-test-password';
function environment() {
  return {
    PREVIEW_PASSWORD: password,
    PREVIEW_LOGIN_LIMITER: { limit: async () => ({ success: true }) },
    ASSETS: { fetch: async () => new Response('private draft or media') },
  };
}
const request = (path, options) => new Request(`https://preview.example.com${path}`, options);
async function signIn(env) {
  return worker.fetch(request('/preview/login/', { method: 'POST', headers: { Origin: 'https://preview.example.com', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ password }) }), env);
}
test('all HTML, feed and media requests require a session; absent secrets fail closed', async () => {
  for (const path of ['/', '/blog/draft/', '/blog/draft/index.html', '/images/private.png', '/audio/private.mp3', '/videos/private.mp4', '/rss.xml']) {
    const response = await worker.fetch(request(path), environment());
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('Location'), '/preview/login/');
    assert.match(response.headers.get('Cache-Control'), /no-store/);
  }
  assert.equal((await worker.fetch(request('/'), { ...environment(), PREVIEW_PASSWORD: '' })).status, 503);
});
test('valid cookie unlocks assets; tampering and password rotation revoke it', async () => {
  const env = environment();
  const login = await signIn(env);
  assert.equal(login.status, 303);
  const header = login.headers.get('Set-Cookie');
  assert.match(header, /Path=\/; HttpOnly; SameSite=Strict/);
  assert.match(header, /Secure/);
  const cookie = header.split(';')[0];
  const response = await worker.fetch(request('/blog/draft/', { headers: { Cookie: cookie } }), env);
  assert.equal(await response.text(), 'private draft or media');
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
  assert.equal((await worker.fetch(request('/', { headers: { Cookie: cookie + 'x' } }), env)).status, 303);
  assert.equal((await worker.fetch(request('/', { headers: { Cookie: cookie } }), { ...env, PREVIEW_PASSWORD: password + 'changed' })).status, 303);
});
test('CSRF, throttling, logout and oversized bodies are handled', async () => {
  const env = environment();
  assert.equal((await worker.fetch(request('/preview/login/', { method: 'POST' }), env)).status, 403);
  env.PREVIEW_LOGIN_LIMITER.limit = async () => ({ success: false });
  assert.equal((await signIn(env)).status, 429);
  const logout = await worker.fetch(request('/preview/logout/', { method: 'POST', headers: { Origin: 'https://preview.example.com' } }), environment());
  assert.match(logout.headers.get('Set-Cookie'), /Max-Age=0/);
  const oversized = await worker.fetch(request('/preview/login/', { method: 'POST', headers: { Origin: 'https://preview.example.com', 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'password=' + 'a'.repeat(9000) }), environment());
  assert.equal(oversized.status, 401);
});

test('expired sessions cannot access the preview', async () => {
  const { createPreviewSession, PREVIEW_SESSION_SECONDS } = await import('../src/lib/preview-auth.ts');
  const token = await createPreviewSession(password, Date.now() - (PREVIEW_SESSION_SECONDS + 1) * 1000);
  assert.equal((await worker.fetch(request('/', { headers: { Cookie: `bcruz97_preview_site=${token}` } }), environment())).status, 303);
});
