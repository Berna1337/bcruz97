import { z } from 'astro/zod';
const optionalText = z.preprocess(value => value === null || value === '' ? undefined : value, z.string().optional());
const photo = z.object({
  image: z.string().regex(/^\/gallery\/[^/\\?#]+\.(?:jpe?g|png|webp|avif)$/i, 'Choose a JPEG, PNG, WebP, or AVIF from Gallery photos.').refine(value => !value.includes('..'), 'Invalid photo path.'),
  alt: z.string().trim().min(1, 'Add a description of the photo.'),
  caption: optionalText,
  date: z.preprocess(value => value === null || value === '' ? undefined : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.').refine(value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Choose a valid date.').optional()),
  draft: z.boolean().default(true),
});
export function parseGallery(value) {
  return z.object({ photos: z.preprocess(value => value == null ? [] : value, z.array(photo)) }).parse(value).photos;
}
// Pages CMS can save an entirely blank file after the last photo is removed.
export function parseGalleryDocument(source) {
  const text = source.trim();
  if (!text) return [];
  let data;
  try {
    data = JSON.parse(text);
  } catch (cause) {
    throw new Error('src/data/gallery.json contains invalid JSON. Fix the file or save the Gallery again in Pages CMS.', { cause });
  }
  return parseGallery(data ?? {});
}
export function visiblePhotos(photos, includeDrafts = false) {
  return photos.filter(photo => includeDrafts === true || !photo.draft);
}
