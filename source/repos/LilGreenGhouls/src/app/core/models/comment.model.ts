import { Timestamp } from 'firebase/firestore';

export interface Comment {
  id?: string;
  postId: string;
  authorName: string;
  authorEmail: string;
  avatarUrl?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}
