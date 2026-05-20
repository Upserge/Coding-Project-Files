import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { bodyHash, findDuplicateReview } from './duplicates';
import { containsProfanity } from './moderation';
import { sendExpoPushBatch, type ExpoPushMessage } from './push';
import { countRecentReports, countRecentReviews, LIMITS } from './rateLimits';

admin.initializeApp();

const CATEGORY_KEYS = [
  'overall',
  'responsiveness',
  'maintenance',
  'safety',
  'value',
  'leaseFairness',
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

interface ReviewDoc {
  userId: string;
  propertyId: string;
  landlordId?: string | null;
  status: string;
  overall: number;
  categories: Record<CategoryKey, number>;
  body: string;
  bodyHash?: string;
  userDisplayName?: string;
}

function computeAverages(
  reviews: Array<{ overall: number; categories: Record<string, number> }>,
) {
  if (reviews.length === 0) {
    return { avgOverall: 0, reviewCount: 0, categoryAverages: {} };
  }

  const categorySums: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  let overallSum = 0;

  for (const review of reviews) {
    overallSum += review.overall;
    for (const key of CATEGORY_KEYS) {
      const val = review.categories[key];
      if (val == null) continue;
      categorySums[key] = (categorySums[key] ?? 0) + val;
      categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
    }
  }

  const categoryAverages: Record<string, number> = {};
  for (const key of CATEGORY_KEYS) {
    if (categoryCounts[key]) {
      categoryAverages[key] =
        Math.round((categorySums[key]! / categoryCounts[key]!) * 10) / 10;
    }
  }

  return {
    avgOverall: Math.round((overallSum / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
    categoryAverages,
  };
}

async function recalculateProperty(propertyId: string) {
  const db = admin.firestore();
  const snap = await db
    .collection('reviews')
    .where('propertyId', '==', propertyId)
    .where('status', '==', 'published')
    .get();

  const reviews = snap.docs.map((d) => d.data() as ReviewDoc);
  const aggregates = computeAverages(reviews);

  await db.collection('properties').doc(propertyId).update({
    ...aggregates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function recalculateLandlord(landlordId: string) {
  const db = admin.firestore();
  const snap = await db
    .collection('reviews')
    .where('landlordId', '==', landlordId)
    .where('status', '==', 'published')
    .get();

  const reviews = snap.docs.map((d) => d.data() as ReviewDoc);
  const aggregates = computeAverages(reviews);

  await db.collection('landlords').doc(landlordId).update({
    ...aggregates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function notifySavedPropertyWatchers(
  propertyId: string,
  review: ReviewDoc,
  reviewId: string,
) {
  const db = admin.firestore();
  const savedSnap = await db
    .collectionGroup('items')
    .where('type', '==', 'property')
    .where('refId', '==', propertyId)
    .get();

  if (savedSnap.empty) return;

  const watcherIds = new Set<string>();
  for (const doc of savedSnap.docs) {
    const userId = doc.ref.parent.parent?.id;
    if (userId && userId !== review.userId) {
      watcherIds.add(userId);
    }
  }

  if (watcherIds.size === 0) return;

  const propertySnap = await db.collection('properties').doc(propertyId).get();
  const address =
    (propertySnap.data()?.formattedAddress as string | undefined) ?? 'A saved property';

  const messages: ExpoPushMessage[] = [];

  await Promise.all(
    [...watcherIds].map(async (uid) => {
      const userSnap = await db.collection('users').doc(uid).get();
      const data = userSnap.data();
      if (data?.pushNotificationsEnabled === false) return;
      const token = data?.expoPushToken as string | undefined;
      if (!token || !token.startsWith('ExponentPushToken')) return;

      messages.push({
        to: token,
        title: 'New review on a saved property',
        body: `${review.userDisplayName ?? 'A renter'} rated ${address}`,
        data: {
          propertyId,
          reviewId,
          type: 'saved_property_review',
        },
        sound: 'default',
      });
    }),
  );

  await sendExpoPushBatch(messages);
}

async function moderatePendingReview(
  reviewId: string,
  after: ReviewDoc,
): Promise<'published' | 'rejected'> {
  const db = admin.firestore();

  const recentCount = await countRecentReviews(db, after.userId);
  if (recentCount > LIMITS.reviewsPerDay) {
    return 'rejected';
  }

  const hash = after.bodyHash ?? bodyHash(after.body ?? '');
  const isDuplicate = await findDuplicateReview(db, after.userId, after.propertyId, hash);
  if (isDuplicate) {
    return 'rejected';
  }

  if (containsProfanity(after.body ?? '')) {
    return 'rejected';
  }

  return 'published';
}

function rejectionReasonForReview(after: ReviewDoc, status: 'published' | 'rejected'): string | null {
  if (status === 'published') return null;
  if (containsProfanity(after.body ?? '')) {
    return 'Your review contains language that violates our community guidelines.';
  }
  return 'This review could not be published. You may have reached the daily limit or submitted duplicate content.';
}

export const onReviewWrite = onDocumentWritten('reviews/{reviewId}', async (event) => {
  const before = event.data?.before?.data() as ReviewDoc | undefined;
  const after = event.data?.after?.data() as ReviewDoc | undefined;
  const review = after ?? before;
  if (!review) return;

  const db = admin.firestore();
  const reviewId = event.params.reviewId;

  if (after && after.status === 'pending') {
    const nextStatus = await moderatePendingReview(reviewId, after);
    const reason = rejectionReasonForReview(after, nextStatus);

    await db.collection('reviews').doc(reviewId).update({
      status: nextStatus,
      ...(reason ? { rejectionReason: reason } : { rejectionReason: admin.firestore.FieldValue.delete() }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (nextStatus === 'published') {
      await Promise.all([
        recalculateProperty(after.propertyId),
        after.landlordId ? recalculateLandlord(after.landlordId) : Promise.resolve(),
        notifySavedPropertyWatchers(after.propertyId, after, reviewId),
      ]);
    }
    return;
  }

  const wasPublished = before?.status === 'published';
  const isPublished = after?.status === 'published';

  if (isPublished && !wasPublished && after) {
    await notifySavedPropertyWatchers(after.propertyId, after, reviewId);
  }

  if (!isPublished) {
    return;
  }

  const propertyIds = new Set<string>();
  if (before?.propertyId) propertyIds.add(before.propertyId);
  if (after?.propertyId) propertyIds.add(after.propertyId);

  const landlordIds = new Set<string>();
  if (before?.landlordId) landlordIds.add(before.landlordId);
  if (after?.landlordId) landlordIds.add(after.landlordId);

  await Promise.all([
    ...[...propertyIds].map((id) => recalculateProperty(id)),
    ...[...landlordIds].map((id) => recalculateLandlord(id)),
  ]);
});

export const onReportCreate = onDocumentCreated('reports/{reportId}', async (event) => {
  const data = event.data?.data();
  if (!data?.reporterId) return;

  const db = admin.firestore();
  const count = await countRecentReports(db, data.reporterId as string);

  if (count > LIMITS.reportsPerDay) {
    await event.data?.ref.delete();
    console.warn('Report deleted — daily limit exceeded for', data.reporterId);
  }
});
