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

export async function userHasReviewForProperty(
  userId: string,
  propertyId: string,
): Promise<boolean> {
  if (!isFirebaseConfigured) {
    return MOCK_REVIEWS.some((r) => r.userId === userId && r.propertyId === propertyId);
  }

  const q = query(
    collection(db, 'reviews'),
    where('userId', '==', userId),
    where('propertyId', '==', propertyId),
    limit(1),
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to submit a review.');

  const overall = input.categories.overall;
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
    body: input.body.trim(),
    tags: input.tags,
    status: 'pending' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!isFirebaseConfigured) {
    const review: Review = {
      id: `review-mock-${Date.now()}`,
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

  const ref = doc(collection(db, 'reviews'));
  await setDoc(ref, payload);
  const snap = await getDoc(ref);
  return mapReview(ref.id, snap.data()!);
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
