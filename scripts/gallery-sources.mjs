import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Deleting an upload in Pages CMS does not remove entries that reference it.
// Omit only missing files; other I/O or image-decoding errors must still fail.
export async function* loadGallerySources(photos, directory, warn = console.warn) {
  for (const photo of photos) {
    let buffer;
    try {
      buffer = await readFile(join(directory, photo.image.slice('/gallery/'.length)));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      warn(`[gallery] Skipping missing photo: ${photo.image}. Re-upload it in Media → Gallery photos, or remove its entry in Gallery.`);
      continue;
    }
    yield { photo, buffer };
  }
}
