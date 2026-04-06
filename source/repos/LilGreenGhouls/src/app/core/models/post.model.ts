import { Timestamp } from 'firebase/firestore';

export interface Post {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  mediaUrls: string[];
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
