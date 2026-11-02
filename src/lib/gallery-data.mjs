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
export function visiblePhotos(photos, includeDrafts = false) {
  return photos.filter(photo => includeDrafts === true || !photo.draft);
}
