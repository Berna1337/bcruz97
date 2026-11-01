import { readdir, mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const root = new URL('../public/', import.meta.url);
export async function prepareMedia() {
  const manifest = {};
  const output = new URL('_media/', root);
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  async function walk(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!prefix && entry.name === '_media') continue;
      const name = `${prefix}${entry.name}`;
      const path = new URL(entry.name, directory);
      if (entry.isDirectory()) { await walk(new URL(`${entry.name}/`, directory), `${name}/`); continue; }
      if ((await stat(path)).size > 25 * 1024 * 1024) throw new Error(`${name} exceeds Cloudflare's 25 MiB file limit. Compress it before uploading.`);
      if (!/\.(?:jpe?g|png|webp|avif)$/i.test(name)) continue;
      const buffer = await readFile(path);
      if (((await sharp(buffer).metadata()).pages || 1) > 1) continue;
      const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
      const variants = [];
      for (const width of [320, 768, 1440]) {
        const filename = `${hash}-${width}.webp`;
        const { data, info } = await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
        await writeFile(new URL(filename, output), data);
        if (!variants.some(item => item.width === info.width)) variants.push({ src: `/_media/${filename}`, width: info.width, height: info.height });
      }
      manifest[`/${name}`] = variants;
    }
  }
  await walk(root);
  await mkdir(new URL('../src/generated/', import.meta.url), { recursive: true });
  await writeFile(new URL('../src/generated/media.json', import.meta.url), JSON.stringify(manifest));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await prepareMedia();
