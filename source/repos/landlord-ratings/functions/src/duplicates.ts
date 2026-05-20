import * as admin from 'firebase-admin';

const DUPLICATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Normalize review text for duplicate detection. */
export function normalizeBody(body: string): string {
  return body
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function bodyHash(body: string): string {
  return normalizeBody(body);
}

/**
 * Reject copy-paste spam: same normalized body on a different property within 7 days.
 */
export async function findDuplicateReview(
  db: admin.firestore.Firestore,
  userId: string,
  propertyId: string,
  hash: string,
): Promise<boolean> {
  if (!hash) return false;

  const since = admin.firestore.Timestamp.fromMillis(Date.now() - DUPLICATE_WINDOW_MS);
  const snap = await db
    .collection('reviews')
    .where('userId', '==', userId)
    .where('bodyHash', '==', hash)
    .where('createdAt', '>=', since)
    .limit(5)
    .get();

  return snap.docs.some((doc) => doc.data().propertyId !== propertyId);
}
