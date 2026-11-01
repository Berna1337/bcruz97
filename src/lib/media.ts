import manifest from '../generated/media.json';
type Variant = { src: string; width: number; height: number };
export function imageAttributes(source: string, thumbnail = false) {
  const variants = (manifest as Record<string, Variant[]>)[source];
  if (!variants?.length) return { src: source };
  const chosen = thumbnail ? variants[0] : variants[variants.length - 1];
  return {
    src: chosen.src,
    srcset: variants.map(item => `${item.src} ${item.width}w`).join(', '),
    sizes: thumbnail ? '(max-width: 740px) 80px, 104px' : '(max-width: 720px) calc(100vw - 40px), 680px',
    width: chosen.width, height: chosen.height,
  };
}
