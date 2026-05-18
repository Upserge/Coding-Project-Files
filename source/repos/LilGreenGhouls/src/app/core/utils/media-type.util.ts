import { MediaType } from '../models/post-media.model';

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
