import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { containsProfanity } from './moderation';

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
  propertyId: string;
  landlordId?: string | null;
  status: string;
  overall: number;
  categories: Record<CategoryKey, number>;
  body: string;
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

export const onReviewWrite = onDocumentWritten('reviews/{reviewId}', async (event) => {
  const before = event.data?.before?.data() as ReviewDoc | undefined;
  const after = event.data?.after?.data() as ReviewDoc | undefined;
  const review = after ?? before;
  if (!review) return;

  const db = admin.firestore();
  const reviewId = event.params.reviewId;

  if (after && after.status === 'pending') {
    const hasProfanity = containsProfanity(after.body ?? '');
    const nextStatus = hasProfanity ? 'rejected' : 'published';
    await db.collection('reviews').doc(reviewId).update({
      status: nextStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    if (nextStatus === 'published') {
      await Promise.all([
        recalculateProperty(after.propertyId),
        after.landlordId ? recalculateLandlord(after.landlordId) : Promise.resolve(),
      ]);
    }
    return;
  }

  if (after?.status !== 'published') {
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
