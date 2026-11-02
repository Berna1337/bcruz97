import { readdir, mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { imageVariants } from './image-variants.mjs';
import { parseGallery, visiblePhotos } from '../src/lib/gallery-data.mjs';
const root = fileURLToPath(new URL('../public/', import.meta.url));
export async function prepareMedia({ includeDrafts = true } = {}) {
  const manifest = {};
  const output = join(root, '_media');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  async function walk(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!prefix && entry.name === '_media') continue;
      const name = `${prefix}${entry.name}`;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { await walk(path, `${name}/`); continue; }
      if ((await stat(path)).size > 25 * 1024 * 1024) throw new Error(`${name} exceeds Cloudflare's 25 MiB file limit. Compress it before uploading.`);
      if (!/\.(?:jpe?g|png|webp|avif)$/i.test(name)) continue;
      const buffer = await readFile(path);
      if (((await sharp(buffer).metadata()).pages || 1) > 1) continue;
      manifest[`/${name}`] = await imageVariants(buffer, output);
    }
  }
  await walk(root);
  const photos = parseGallery(JSON.parse(await readFile(new URL('../src/data/gallery.json', import.meta.url), 'utf8')));
  for (const photo of visiblePhotos(photos, includeDrafts)) {
    if (manifest[photo.image]) continue;
    const source = new URL('../src/assets/gallery/', import.meta.url);
    const buffer = await readFile(join(fileURLToPath(source), photo.image.slice('/gallery/'.length)));
    if (((await sharp(buffer).metadata()).pages || 1) > 1) throw new Error(`Gallery photo ${photo.image} is animated. Upload a still photo instead.`);
    manifest[photo.image] = await imageVariants(buffer, output, { widths: [480, 960, 1600, 2400], maxHeight: 2400 });
  }
  await mkdir(new URL('../src/generated/', import.meta.url), { recursive: true });
  await writeFile(new URL('../src/generated/media.json', import.meta.url), JSON.stringify(manifest));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await prepareMedia();
