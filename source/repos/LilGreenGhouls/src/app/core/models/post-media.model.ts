export type MediaType = 'image' | 'video' | 'audio';

export interface PostMediaItem {
  url: string;
  type: MediaType;
  title?: string;
  caption?: string;
  /** Optional artwork shown while audio plays */
  coverImageUrl?: string;
}
