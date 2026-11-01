/** @typedef {import('hast').Element} Element */
/** @typedef {import('hast').Root | Element} Parent */

const audioExtensions = /\.(?:mp3|m4a|ogg|wav)$/i;
const videoExtensions = /\.(?:mp4|webm)$/i;
const imageExtensions = /\.(?:png|jpe?g|webp|gif|avif|svg)$/i;

function mediaKind(href) {
  // Root-relative uploads or explicit HTTPS URLs; never executable/data URLs.
  if (!href.startsWith('https://') && !(href.startsWith('/') && !href.startsWith('//'))) return null;
  let url;
  try { url = new URL(href, 'https://bcruz97.com'); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  if (videoExtensions.test(url.pathname)) return 'video';
  if (audioExtensions.test(url.pathname)) return 'audio';
  if (imageExtensions.test(url.pathname)) return 'image';
  return null;
}

/** @type {import('unified').Plugin<[], import('hast').Root>} */
export default function rehypeMedia() {
  /** @param {Parent} parent */
  function visit(parent) {
    for (let index = 0; index < parent.children.length; index++) {
      const node = parent.children[index];
      if (node.type !== 'element' || ['pre', 'code'].includes(node.tagName)) continue;
      if (node.tagName === 'p') {
        const children = node.children.filter(child => child.type !== 'text' || child.value.trim());
        const only = children.length === 1 ? children[0] : null;
        let href = null;
        let label = '';
        if (only?.type === 'element' && only.tagName === 'a') {
          href = only.properties.href;
          label = only.children.filter(child => child.type === 'text').map(child => child.value).join('').trim();
        } else if (only?.type === 'text') href = only.value.trim();
        const kind = typeof href === 'string' ? mediaKind(href) : null;
        if (kind && typeof href === 'string') {
          if (label === href) label = '';
          /** @type {Element} */
          const figure = { type: 'element', tagName: 'figure', properties: { className: [`${kind}-embed`] }, children: [] };
          if (kind === 'audio' || kind === 'video') {
            figure.children = [
              {
                type: 'element', tagName: kind,
                properties: { src: href, controls: true, preload: 'none', ...(kind === 'video' ? { playsInline: true } : {}), 'aria-label': label || (kind === 'audio' ? 'Audio clip' : 'Video clip') },
                children: [{ type: 'text', value: `Your browser cannot play this ${kind}.` }],
              },
              {
                type: 'element', tagName: 'figcaption', properties: {},
                children: [{ type: 'element', tagName: 'a', properties: { href }, children: [{ type: 'text', value: `Download ${kind}` }] }],
              },
            ];
          } else {
            figure.children = [{ type: 'element', tagName: 'img', properties: { src: href, alt: label, loading: 'lazy', decoding: 'async' }, children: [] }];
          }
          parent.children[index] = figure;
          continue;
        }
      }
      visit(node);
    }
  }
  return visit;
}
