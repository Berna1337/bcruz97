import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { parseGallery, parseGalleryDocument, visiblePhotos } from '../src/lib/gallery-data.mjs';
import { imageVariants } from '../scripts/image-variants.mjs';

test('gallery preserves editor order, defaults to draft and filters production photos', () => {
  const photos = parseGallery({ photos: [
    { image: '/gallery/one.jpg', alt: 'First photo' },
    { image: '/gallery/two.png', alt: 'Second photo', draft: false, caption: 'A caption', date: '2026-11-02' },
  ] });
  assert.equal(photos[0].draft, true);
  assert.deepEqual(visiblePhotos(photos).map(photo => photo.alt), ['Second photo']);
  assert.deepEqual(visiblePhotos(photos, true).map(photo => photo.alt), ['First photo', 'Second photo']);
  assert.equal(visiblePhotos(photos, 'false').length, 1);
  assert.deepEqual(parseGallery({ photos: [] }), []);
  assert.deepEqual(parseGallery({ photos: null }), []);
  assert.deepEqual(parseGallery({}), []);
});

test('gallery rejects invalid dates, missing descriptions and non-gallery paths', () => {
  const valid = { image: '/gallery/photo.jpg', alt: 'A photo' };
  for (const overrides of [
    { alt: ' ' }, { image: '/gallery/../secret.jpg' }, { image: 'https://example.com/photo.jpg' },
    { image: '/gallery/nested/photo.jpg' }, { image: '/gallery/photo.svg' }, { date: '2026-02-31' },
  ]) assert.throws(() => parseGallery({ photos: [{ ...valid, ...overrides }] }));
  assert.equal(parseGallery({ photos: [{ ...valid, caption: null, date: '' }] })[0].date, undefined);
});

test('gallery re-encoding removes embedded metadata and keeps full portrait proportions', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bcruz-gallery-'));
  try {
    const original = await sharp({ create: { width: 600, height: 900, channels: 3, background: '#557766' } })
      .jpeg().withExif({ IFD0: { Artist: 'Private metadata', ImageDescription: 'Private camera information' } }).toBuffer();
    assert.ok((await sharp(original).metadata()).exif);
    const variants = await imageVariants(original, directory, { widths: [240, 480, 960], maxHeight: 720 });
    assert.equal(variants[0].width, 240);
    assert.equal(variants[0].height, 360);
    for (const variant of variants) {
      const buffer = await readFile(join(directory, variant.src.split('/').at(-1)));
      const metadata = await sharp(buffer).metadata();
      assert.equal(metadata.exif, undefined);
      assert.equal(metadata.xmp, undefined);
      assert.equal(metadata.iptc, undefined);
      assert.ok(metadata.height <= 720);
      assert.equal(metadata.width / metadata.height, 600 / 900);
    }
    const rotatedSource = await sharp(original).withMetadata({ orientation: 6 }).toBuffer();
    const rotated = await imageVariants(rotatedSource, directory, { widths: [240], maxHeight: 720 });
    assert.equal(rotated[0].width, 240);
    assert.equal(rotated[0].height, 160, 'phone orientation should be applied before resizing');
    const rotatedMetadata = await sharp(join(directory, rotated[0].src.split('/').at(-1))).metadata();
    assert.equal(rotatedMetadata.orientation, undefined);
    assert.equal(rotatedMetadata.exif, undefined);
    assert.ok((await sharp(original).metadata()).exif, 'source should remain unchanged');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('a deleted upload is omitted with an actionable warning, while valid photos remain', async () => {
  const { loadGallerySources } = await import('../scripts/gallery-sources.mjs');
  const { writeFile, mkdir } = await import('node:fs/promises');
  const directory = await mkdtemp(join(tmpdir(), 'bcruz-gallery-missing-'));
  try {
    await writeFile(join(directory, 'kept.jpg'), 'existing photo');
    const photos = parseGallery({ photos: [
      { image: '/gallery/deleted.jpg', alt: 'Deleted photo' },
      { image: '/gallery/kept.jpg', alt: 'Existing photo', draft: false },
    ] });
    const warnings = [];
    const sources = [];
    for await (const source of loadGallerySources(photos, directory, message => warnings.push(message))) sources.push(source);
    assert.deepEqual(sources.map(source => source.photo.alt), ['Existing photo']);
    assert.equal(sources[0].buffer.toString(), 'existing photo');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /deleted\.jpg/);
    assert.match(warnings[0], /Re-upload/);
    await mkdir(join(directory, 'invalid.jpg'));
    await assert.rejects(async () => {
      for await (const source of loadGallerySources([{ image: '/gallery/invalid.jpg' }], directory)) void source;
    }, { code: 'EISDIR' });
  } finally { await rm(directory, { recursive: true, force: true }); }
});


test('an empty Pages CMS gallery file is valid, but malformed JSON still fails', () => {
  for (const source of ['', ' \n\t', '\uFEFF\n', '{}', 'null', '{"photos":[]}', '{"photos":null}']) {
    assert.deepEqual(parseGalleryDocument(source), []);
  }
  const photos = parseGalleryDocument(JSON.stringify({ photos: [{ image: '/gallery/photo.jpg', alt: 'A real photo', draft: false }] }));
  assert.equal(photos.length, 1);
  assert.equal(photos[0].draft, false);
  assert.throws(() => parseGalleryDocument('{"photos": ['), /gallery.json contains invalid JSON/);
  assert.throws(() => parseGalleryDocument('{"photos":"not a list"}'));
});
