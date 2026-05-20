import { isHeicFile } from './media-type.util';

/**
 * Converts HEIC/HEIF to JPEG in the browser so uploads display in all browsers.
 * Non-HEIC files are returned unchanged.
 */
export async function prepareImageFileForUpload(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });

  const jpegBlob = Array.isArray(result) ? result[0] : result;
  const jpegName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');

  return new File([jpegBlob], jpegName, { type: 'image/jpeg' });
}
