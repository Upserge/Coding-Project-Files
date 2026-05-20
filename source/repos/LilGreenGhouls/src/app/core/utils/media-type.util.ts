import { MediaType } from '../models/post-media.model';

/** File input accept value for image and cover uploads (includes iPhone HEIC/HEIF). */
export const IMAGE_FILE_ACCEPT =
  'image/*,.heic,.heif,image/heic,image/heif';

/** Media gallery accept: images (incl. HEIC), video, and audio. */
export const MEDIA_GALLERY_ACCEPT = `${IMAGE_FILE_ACCEPT},video/*,audio/*`;

const HEIC_EXTENSIONS = ['heic', 'heif'] as const;
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'wma', 'flac'] as const;
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'm4v'] as const;

const MEDIA_TYPE_BY_EXTENSION: Record<string, MediaType> = {
  ...Object.fromEntries(AUDIO_EXTENSIONS.map(ext => [ext, 'audio' as const])),
  ...Object.fromEntries(VIDEO_EXTENSIONS.map(ext => [ext, 'video' as const])),
};

export function extractFileExtension(url: string): string {
  const withoutParams = url.split('?')[0];
  return withoutParams.split('.').pop()?.toLowerCase() ?? '';
}

export function isHeicFile(file: File): boolean {
  const extension = extractFileExtension(file.name);
  if (HEIC_EXTENSIONS.includes(extension as (typeof HEIC_EXTENSIONS)[number])) {
    return true;
  }
  return file.type === 'image/heic' || file.type === 'image/heif';
}

export function getMediaTypeFromUrl(url: string): MediaType {
  const extension = extractFileExtension(url);
  return MEDIA_TYPE_BY_EXTENSION[extension] ?? 'image';
}

export function isAudioUrl(url: string): boolean {
  return getMediaTypeFromUrl(url) === 'audio';
}

export function isVideoUrl(url: string): boolean {
  return getMediaTypeFromUrl(url) === 'video';
}
