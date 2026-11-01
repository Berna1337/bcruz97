import { readFile, access } from 'node:fs/promises';
import { globSync } from 'node:fs';
import assert from 'node:assert/strict';
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
