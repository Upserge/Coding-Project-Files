export type MediaType = 'image' | 'video' | 'audio';
export type MediaImageFit = 'cover' | 'contain';

export interface PostMediaItem {
  url: string;
  type: MediaType;
  title?: string;
  caption?: string;
  /** Controls how image media is framed in the adventure detail view */
  imageFit?: MediaImageFit;
  /** Optional artwork shown while audio plays */
  coverImageUrl?: string;
  /** Controls how audio artwork is framed in the adventure detail view */
  coverImageFit?: MediaImageFit;
}
