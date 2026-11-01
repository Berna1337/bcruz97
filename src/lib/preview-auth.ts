const encoder = new TextEncoder();
export const PREVIEW_SESSION_SECONDS = 60 * 60 * 24 * 7;

export function previewConfigured(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 16;
}

export async function passwordMatches(input: string, expected: string): Promise<boolean> {
  if (input.length > 1024) return false;
  const hashes = await Promise.all([input, expected].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const left = new Uint8Array(hashes[0]);
  const right = new Uint8Array(hashes[1]);
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index];
  return difference === 0;
}

function signingKey(password: string) {
  return crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createPreviewSession(password: string, now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + PREVIEW_SESSION_SECONDS;
  const signature = await crypto.subtle.sign('HMAC', await signingKey(password), encoder.encode(`bcruz97-preview:${expires}`));
  return `${expires}.${Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

export async function validPreviewSession(token: string | undefined, password: string, now = Date.now()): Promise<boolean> {
  if (!token || token.length > 100) return false;
  const match = token.match(/^(\d+)\.([a-f0-9]{64})$/);
  if (!match) return false;
  const expires = Number(match[1]);
  const seconds = Math.floor(now / 1000);
  if (!Number.isSafeInteger(expires) || expires <= seconds || expires > seconds + PREVIEW_SESSION_SECONDS) return false;
  const signature = Uint8Array.from(match[2].match(/../g)!, byte => Number.parseInt(byte, 16));
  return crypto.subtle.verify('HMAC', await signingKey(password), signature, encoder.encode(`bcruz97-preview:${expires}`));
}

// The sign-in form only needs a small URL-encoded request body.
export async function readPreviewPassword(request: Request): Promise<string | null> {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/x-www-form-urlencoded') return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let size = 0;
  let body = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  return new URLSearchParams(body).get('password');
}
