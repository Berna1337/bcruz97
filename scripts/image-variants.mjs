import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
/** Re-encoding without keepMetadata/withMetadata strips EXIF (including GPS), XMP and IPTC. */
export async function imageVariants(buffer, output, { widths = [320, 768, 1440], maxHeight } = {}) {
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  const variants = [];
  for (const width of widths) {
    const filename = `${hash}-${width}${maxHeight ? `-h${maxHeight}` : ''}.webp`;
    const { data, info } = await sharp(buffer).rotate().resize({ width, height: maxHeight, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    await writeFile(join(output, filename), data);
    if (!variants.some(item => item.width === info.width)) variants.push({ src: `/_media/${filename}`, width: info.width, height: info.height });
  }
  return variants;
}
