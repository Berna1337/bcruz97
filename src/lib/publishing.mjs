/** Estimate reading time from prose, without counting destinations or markup. */
export function readingMinutes(markdown = '') {
  const text = markdown
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/<[^>]+>/g, '');
  return Math.max(1, Math.ceil((text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu)?.length || 0) / 200));
}
