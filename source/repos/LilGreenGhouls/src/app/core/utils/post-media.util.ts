import { Post } from '../models/post.model';
import { MediaType, PostMediaItem } from '../models/post-media.model';
import { getMediaTypeFromUrl } from './media-type.util';

type PostMediaSource = Pick<Post, 'mediaItems' | 'mediaUrls'>;

export function resolvePostMedia(source: PostMediaSource): PostMediaItem[] {
  const storedItems = source.mediaItems;
  if (storedItems?.length) {
    return storedItems.map(enrichMediaItem);
  }

  const legacyUrls = source.mediaUrls;
  if (!legacyUrls?.length) {
    return [];
  }

  return legacyUrls.map(createMediaItemFromUrl);
}

export function toMediaUrlList(items: PostMediaItem[]): string[] {
  return items.map(item => item.url);
}

export function createMediaItemFromUrl(url: string): PostMediaItem {
  return enrichMediaItem({
    url,
    type: getMediaTypeFromUrl(url),
    title: '',
    caption: '',
  });
}

export function enrichMediaItem(item: PostMediaItem): PostMediaItem {
  const type = item.type ?? getMediaTypeFromUrl(item.url);
  return {
    ...item,
    type,
    title: item.title ?? '',
    caption: item.caption ?? '',
    imageFit: item.imageFit ?? 'cover',
    coverImageUrl: type === 'audio' ? item.coverImageUrl ?? '' : undefined,
    coverImageFit: type === 'audio' ? item.coverImageFit ?? 'cover' : undefined,
  };
}

export function sanitizeMediaItem(item: PostMediaItem): PostMediaItem {
  const enriched = enrichMediaItem(item);
  const sanitized: PostMediaItem = {
    url: enriched.url,
    type: enriched.type,
    title: enriched.title?.trim() ?? '',
    caption: enriched.caption?.trim() ?? '',
    imageFit: enriched.imageFit ?? 'cover',
  };

  const cover = enriched.coverImageUrl?.trim();
  if (enriched.type !== 'audio') {
    return sanitized;
  }

  if (!cover) {
    return sanitized;
  }

  return {
    ...sanitized,
    coverImageUrl: cover,
    coverImageFit: enriched.coverImageFit ?? 'cover',
  };
}

export function preparePostMediaForSave(items: PostMediaItem[]): {
  mediaItems: PostMediaItem[];
  mediaUrls: string[];
} {
  const mediaItems = items.map(sanitizeMediaItem);
  return { mediaItems, mediaUrls: toMediaUrlList(mediaItems) };
}

export function partitionMediaItems(items: PostMediaItem[]): {
  audioItems: PostMediaItem[];
  galleryItems: PostMediaItem[];
} {
  return {
    audioItems: items.filter(item => item.type === 'audio'),
    galleryItems: items.filter(item => item.type !== 'audio'),
  };
}

export function normalizePost<T extends Post>(post: T): T {
  const mediaItems = resolvePostMedia(post);
  return {
    ...post,
    mediaItems,
    mediaUrls: toMediaUrlList(mediaItems),
  };
}

export function inferMediaTypeFromFile(file: File): MediaType {
  return getMediaTypeFromUrl(file.name);
}
