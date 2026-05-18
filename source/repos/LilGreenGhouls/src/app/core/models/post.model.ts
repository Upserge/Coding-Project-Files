import { Timestamp } from 'firebase/firestore';
import { PostMediaItem } from './post-media.model';

export interface Post {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  /** @deprecated Use mediaItems — kept for legacy Firestore documents */
  mediaUrls: string[];
  mediaItems?: PostMediaItem[];
  youtubeEmbeds: string[];
  externalLinks: ExternalLink[];
  tags: string[];
  status: 'draft' | 'published';
  authorUid: string;
  authorName: string;
  publishedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ExternalLink {
  label: string;
  url: string;
}
