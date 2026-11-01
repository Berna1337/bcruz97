/** @typedef {import('hast').Element} Element */
/** @typedef {import('hast').Root | Element} Parent */

/** Read supported YouTube video links; leave playlists and other sites alone. */
function youtubeVideo(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  let id;
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    if (parts.length === 1) id = parts[0];
  } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else if (parts.length === 2 && ['embed', 'shorts', 'live'].includes(parts[0])) id = parts[1];
  }
  if (!id || !/^[\w-]{11}$/.test(id)) return null;

  // Preserve shared timestamps such as ?t=90 or ?t=1m30s.
  const timestamp = url.searchParams.get('start') ?? url.searchParams.get('t') ?? '';
  let start = 0;
  if (/^\d+$/.test(timestamp)) start = Number(timestamp);
  else {
    const match = timestamp.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (match) start = Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
  }
  if (!Number.isSafeInteger(start) || start < 0) start = 0;
  return { id, start };
}

/** @type {import('unified').Plugin<[], import('hast').Root>} */
export default function rehypeYouTube() {
  /** @param {Parent} parent */
  function visit(parent) {
    for (let index = 0; index < parent.children.length; index++) {
      const node = parent.children[index];
      if (node.type !== 'element') continue;
      if (['pre', 'code'].includes(node.tagName)) continue;
      if (node.tagName === 'p') {
        const children = node.children.filter(child => child.type !== 'text' || child.value.trim());
        const only = children.length === 1 ? children[0] : null;
        let href = null;
        if (only?.type === 'element' && only.tagName === 'a') href = only.properties.href;
        else if (only?.type === 'text') href = only.value.trim();
        const video = typeof href === 'string' ? youtubeVideo(href) : null;
        if (video) {
          const src = `https://www.youtube.com/embed/${video.id}${video.start ? `?start=${video.start}` : ''}`;
          parent.children[index] = {
            type: 'element', tagName: 'figure', properties: { className: ['video-embed'] },
            children: [
              {
                type: 'element', tagName: 'iframe',
                properties: {
                  src, title: 'YouTube video player', loading: 'lazy',
                  width: 640, height: 360,
                  referrerPolicy: 'strict-origin-when-cross-origin',
                  allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
                  allowFullScreen: true,
                },
                children: [],
              },
              {
                type: 'element', tagName: 'figcaption', properties: {},
                children: [{
                  type: 'element', tagName: 'a',
                  properties: { href: `https://www.youtube.com/watch?v=${video.id}${video.start ? `&t=${video.start}` : ''}` },
                  children: [{ type: 'text', value: 'Watch on YouTube' }],
                }],
              },
            ],
          };
          continue;
        }
      }
      visit(node);
    }
  }
  return visit;
}
