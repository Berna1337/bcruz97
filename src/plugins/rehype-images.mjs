import { readFileSync } from 'node:fs';
/** Local images get build-time WebP variants; remote images and animations stay intact. */
export default function rehypeImages() {
  const manifest = JSON.parse(readFileSync(new URL('../generated/media.json', import.meta.url), 'utf8'));
  return function visit(node) {
    if (node.type === 'element' && node.tagName === 'img') {
      const variants = manifest[node.properties.src];
      if (variants?.length) {
        const largest = variants.at(-1);
        Object.assign(node.properties, {
          src: largest.src,
          srcSet: variants.map(item => `${item.src} ${item.width}w`).join(', '),
          sizes: '(max-width: 720px) calc(100vw - 40px), 680px',
          width: largest.width, height: largest.height, loading: 'lazy', decoding: 'async',
        });
      }
    }
    for (const child of node.children || []) visit(child);
  };
}
