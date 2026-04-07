import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from '@angular/fire/firestore';
import { Post } from '../models/post.model';

export interface DashboardAnalytics {
  publishedCount: number;
  draftCount: number;
  subscriberCount: number;
  fcmTokenCount: number;
  recentPosts: Post[];
  postsThisMonth: number;
  subscribersThisMonth: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private firestore = inject(Firestore);

  /**
   * Fetch all dashboard analytics in parallel for efficient loading.
   */
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTimestamp = Timestamp.fromDate(startOfMonth);

    const [
      publishedCount,
      draftCount,
      subscriberCount,
      fcmTokenCount,
      recentPosts,
      postsThisMonth,
      subscribersThisMonth,
    ] = await Promise.all([
      this.countByField('posts', 'status', 'published'),
      this.countByField('posts', 'status', 'draft'),
      this.countByField('subscribers', 'active', true),
      this.countCollection('fcmTokens'),
      this.getRecentPosts(5),
      this.countAfterDate('posts', 'publishedAt', monthTimestamp),
      this.countAfterDate('subscribers', 'subscribedAt', monthTimestamp),
    ]);

    return {
      publishedCount,
      draftCount,
      subscriberCount,
      fcmTokenCount,
      recentPosts,
      postsThisMonth,
      subscribersThisMonth,
    };
  }

  private async countByField(collectionName: string, field: string, value: unknown): Promise<number> {
    const q = query(
      collection(this.firestore, collectionName),
      where(field, '==', value),
    );
    const snap = await getDocs(q);
    return snap.size;
  }

  private async countCollection(collectionName: string): Promise<number> {
    const snap = await getDocs(collection(this.firestore, collectionName));
    return snap.size;
  }

  private async getRecentPosts(count: number): Promise<Post[]> {
    const q = query(
      collection(this.firestore, 'posts'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(count),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Post);
  }

  private async countAfterDate(collectionName: string, dateField: string, after: Timestamp): Promise<number> {
    const q = query(
      collection(this.firestore, collectionName),
      where(dateField, '>=', after),
    );
    const snap = await getDocs(q);
    return snap.size;
  }
}
