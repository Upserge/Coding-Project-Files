import * as admin from 'firebase-admin';

export const LIMITS = {
  reviewsPerDay: 5,
  reportsPerDay: 10,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function countRecentReviews(db: admin.firestore.Firestore, userId: string): Promise<number> {
  const since = admin.firestore.Timestamp.fromMillis(Date.now() - DAY_MS);
  const snap = await db
    .collection('reviews')
    .where('userId', '==', userId)
    .where('createdAt', '>=', since)
    .get();
  return snap.size;
}

export async function countRecentReports(
  db: admin.firestore.Firestore,
  reporterId: string,
): Promise<number> {
  const since = admin.firestore.Timestamp.fromMillis(Date.now() - DAY_MS);
  const snap = await db
    .collection('reports')
    .where('reporterId', '==', reporterId)
    .where('createdAt', '>=', since)
    .get();
  return snap.size;
}
