import { readFile, access } from 'node:fs/promises';
import { globSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parseGallery, visiblePhotos } from '../src/lib/gallery-data.mjs';
// Inspect the generated route names so custom slugs, nested posts and Unicode
// filenames are checked exactly as Astro built them.
for (const file of globSync('dist-preview/blog/**/index.html')) {
  const html = await readFile(file, 'utf8');
  const metadata = html.match(/<div class="article-meta mono">([\s\S]*?)<\/div>/)?.[1];
  if (!metadata?.includes('<span>Draft</span>')) continue;
  await assert.rejects(access(file.replace(/^dist-preview\//, 'dist/')), `Draft appeared in production: ${file}`);
}
const production = await readFile('dist/index.html', 'utf8');
const preview = await readFile('dist-preview/index.html', 'utf8');
assert.ok(!production.includes('Private preview · Includes drafts'));
assert.ok(preview.includes('Private preview · Includes drafts'));
console.log('Verified production excludes drafts and preview includes them.');

const photos = parseGallery(JSON.parse(await readFile('src/data/gallery.json', 'utf8')));
for (const [directory, preview] of [['dist', false], ['dist-preview', true]]) {
  const html = await readFile(`${directory}/gallery/index.html`, 'utf8');
  const count = [...html.matchAll(/data-gallery-photo(?:[\s>])/g)].length;
  assert.equal(count, visiblePhotos(photos, preview).length, `Wrong gallery visibility in ${directory}`);
  assert.ok(!/src="\/gallery\/[^"/]+"/.test(html), 'Gallery must serve processed images, never originals');
}
console.log('Verified gallery visibility and processed image URLs in both builds.');
