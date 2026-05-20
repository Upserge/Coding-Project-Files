import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/src/services/firebase';
import type { CreateReviewInput, Review } from '@/src/types';
import { sortReviews, type ReviewSort } from '@/src/utils/ratings';
import { MOCK_REVIEWS } from '@/src/services/mockData';
import { auth } from '@/src/services/firebase';
import { containsProfanity } from '@/src/utils/moderation';
import { bodyHash } from '@/src/utils/bodyHash';

function mapReview(id: string, data: Record<string, unknown>): Review {
  return { id, ...(data as Omit<Review, 'id'>) };
}

export async function getReviewsForProperty(
  propertyId: string,
  sort: ReviewSort = 'newest',
): Promise<Review[]> {
  let reviews: Review[] = [];

  if (!isFirebaseConfigured) {
    reviews = MOCK_REVIEWS.filter(
      (r) => r.propertyId === propertyId && r.status === 'published',
    );
  } else {
    const q = query(
      collection(db, 'reviews'),
      where('propertyId', '==', propertyId),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    reviews = snap.docs.map((d) => mapReview(d.id, d.data()));
  }

  return sortReviews(reviews, sort);
}

export async function getReviewsForLandlord(
  landlordId: string,
  sort: ReviewSort = 'newest',
): Promise<Review[]> {
  let reviews: Review[] = [];

  if (!isFirebaseConfigured) {
    reviews = MOCK_REVIEWS.filter(
      (r) => r.landlordId === landlordId && r.status === 'published',
    );
  } else {
    const q = query(
      collection(db, 'reviews'),
      where('landlordId', '==', landlordId),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    reviews = snap.docs.map((d) => mapReview(d.id, d.data()));
  }

  return sortReviews(reviews, sort);
}

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  if (!isFirebaseConfigured) {
    return MOCK_REVIEWS.filter((r) => r.userId === userId);
  }

  const q = query(
    collection(db, 'reviews'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapReview(d.id, d.data()));
}

/** One review per user per property — deterministic doc id avoids fragile list queries. */
export function reviewDocId(userId: string, propertyId: string): string {
  return `${userId}_${propertyId}`;
}

export async function userHasReviewForProperty(
  userId: string,
  propertyId: string,
): Promise<boolean> {
  if (!isFirebaseConfigured) {
    return MOCK_REVIEWS.some((r) => r.userId === userId && r.propertyId === propertyId);
  }

  const snap = await getDoc(doc(db, 'reviews', reviewDocId(userId, propertyId)));
  return snap.exists();
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to submit a review.');

  const body = input.body.trim();
  if (containsProfanity(body)) {
    throw new Error('Your review contains language that violates our community guidelines.');
  }

  const overall = input.categories.overall;
  const status = 'pending' as const;

  const payload = {
    userId: user.uid,
    userDisplayName: user.displayName ?? 'Anonymous Renter',
    propertyId: input.propertyId,
    landlordId: input.landlordId ?? null,
    moveIn: input.moveIn,
    moveOut: input.moveOut ?? null,
    isCurrent: input.isCurrent,
    overall,
    categories: input.categories,
    body,
    bodyHash: bodyHash(body),
    tags: input.tags,
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!isFirebaseConfigured) {
    const review: Review = {
      id: reviewDocId(user.uid, input.propertyId),
      ...payload,
      landlordId: input.landlordId,
      moveOut: input.moveOut,
      status: 'published',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as Review;
    MOCK_REVIEWS.unshift(review);
    const prop = await import('@/src/services/properties').then((m) =>
      m.getProperty(input.propertyId),
    );
    if (prop) {
      prop.reviewCount += 1;
      prop.avgOverall = overall;
    }
    return review;
  }

  const ref = doc(db, 'reviews', reviewDocId(user.uid, input.propertyId));
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error('You have already reviewed this property.');
  }

  try {
    await setDoc(ref, payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('permission') || message.includes('PERMISSION_DENIED')) {
      throw new Error(
        'Permission denied writing review. Deploy the latest firestore.rules: npm run firebase:deploy',
      );
    }
    throw e;
  }

  const snap = await getDoc(ref);
  return mapReview(ref.id, snap.data()!);
}

/** Poll until Cloud Functions moderate a pending review (or timeout). */
export async function waitForReviewModeration(
  reviewId: string,
  options: { maxAttempts?: number; intervalMs?: number } = {},
): Promise<Review> {
  if (!isFirebaseConfigured) {
    const review = await getReviewById(reviewId);
    if (!review) throw new Error('Review not found after submission.');
    if (review.status === 'rejected') {
      throw new Error(review.rejectionReason ?? 'Review could not be published.');
    }
    return review;
  }

  const maxAttempts = options.maxAttempts ?? 15;
  const intervalMs = options.intervalMs ?? 600;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const snap = await getDoc(doc(db, 'reviews', reviewId));
    if (!snap.exists()) {
      throw new Error('Review not found after submission.');
    }

    const review = mapReview(reviewId, snap.data()!);
    if (review.status === 'published') return review;
    if (review.status === 'rejected') {
      throw new Error(
        review.rejectionReason ??
          'Your review could not be published. Please check our guidelines and try again later.',
      );
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(
    'Your review is still being processed. Check Account → My reviews in a moment.',
  );
}

export async function getReviewById(reviewId: string): Promise<Review | null> {
  if (!isFirebaseConfigured) {
    return MOCK_REVIEWS.find((r) => r.id === reviewId) ?? null;
  }

  const snap = await getDoc(doc(db, 'reviews', reviewId));
  if (!snap.exists()) return null;
  return mapReview(reviewId, snap.data()!);
}

export async function deleteReview(reviewId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  if (!isFirebaseConfigured) {
    const idx = MOCK_REVIEWS.findIndex((r) => r.id === reviewId && r.userId === user.uid);
    if (idx >= 0) MOCK_REVIEWS.splice(idx, 1);
    return;
  }

  const ref = doc(db, 'reviews', reviewId);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().userId !== user.uid) {
    throw new Error('Review not found');
  }
  await deleteDoc(ref);
}
