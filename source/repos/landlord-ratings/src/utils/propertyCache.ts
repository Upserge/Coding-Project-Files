import type { QueryClient } from '@tanstack/react-query';
import { getProperty } from '@/src/services/properties';
import { getReviewsForProperty } from '@/src/services/reviews';
import type { Property, Review } from '@/src/types';
import type { ReviewSort } from '@/src/utils/ratings';
import { computePropertyStats, sortReviews } from '@/src/utils/ratings';

const REVIEW_SORTS: ReviewSort[] = ['newest', 'highest', 'lowest'];

/** Patch a property everywhere it appears in React Query caches (map, search, detail). */
export function patchPropertyInCaches(
  queryClient: QueryClient,
  propertyId: string,
  updater: (property: Property) => Property,
) {
  queryClient.setQueriesData<Property>({ queryKey: ['property', propertyId] }, (old) =>
    old ? updater(old) : old,
  );

  queryClient.setQueriesData<Property[]>({ queryKey: ['properties'] }, (old) => {
    if (!old) return old;
    return old.map((p) => (p.id === propertyId ? updater(p) : p));
  });
}

/** Immediate UI update before server aggregates catch up. */
export function optimisticallyApplyReview(
  queryClient: QueryClient,
  property: Property,
  reviewOverall: number,
) {
  patchPropertyInCaches(queryClient, property.id, (p) => {
    const nextCount = p.reviewCount + 1;
    const nextAvg =
      nextCount <= 1
        ? reviewOverall
        : Math.round(((p.avgOverall * p.reviewCount + reviewOverall) / nextCount) * 10) / 10;
    return {
      ...p,
      reviewCount: nextCount,
      avgOverall: nextAvg,
    };
  });
}

/**
 * Build the Explore map pin list from published reviews (not Firestore aggregates).
 * Property docs remain after reviews are deleted; geohash queries still return them.
 */
export async function enrichPropertiesForMap(
  properties: Property[],
  queryClient: QueryClient,
): Promise<Property[]> {
  const withReviews: Property[] = [];

  await Promise.all(
    properties.map(async (property) => {
      const cached = queryClient.getQueryData<Property>(['property', property.id]);
      const mightHaveReviews =
        property.reviewCount > 0 || (cached?.reviewCount ?? 0) > 0 || cached != null;

      if (!mightHaveReviews) return;

      const reviews = await getReviewsForProperty(property.id);
      const stats = computePropertyStats(reviews);
      if (stats.reviewCount === 0) {
        queryClient.setQueryData(['property', property.id], { ...property, ...stats });
        return;
      }

      const merged: Property = { ...property, ...stats };
      queryClient.setQueryData(['property', property.id], merged);
      withReviews.push(merged);
    }),
  );

  return withReviews;
}

export function seedReviewInCache(
  queryClient: QueryClient,
  propertyId: string,
  review: Review,
) {
  for (const sort of REVIEW_SORTS) {
    queryClient.setQueryData<Review[]>(['reviews', 'property', propertyId, sort], (old) => {
      const without = (old ?? []).filter((r) => r.id !== review.id);
      return sortReviews([review, ...without], sort);
    });
  }
}

export function removeReviewFromCache(
  queryClient: QueryClient,
  propertyId: string,
  reviewId: string,
) {
  for (const sort of REVIEW_SORTS) {
    queryClient.setQueryData<Review[]>(['reviews', 'property', propertyId, sort], (old) =>
      (old ?? []).filter((r) => r.id !== reviewId),
    );
  }
}

/** Drop a property from map/search lists (e.g. last review deleted). */
export function removePropertyFromNearbyCaches(queryClient: QueryClient, propertyId: string) {
  queryClient.setQueriesData<Property[]>({ queryKey: ['properties'] }, (old) =>
    old ? old.filter((p) => p.id !== propertyId) : old,
  );
}

/**
 * Derive pin/header stats from published reviews (source of truth for UI).
 * Firestore property aggregates only update when Cloud Functions are deployed.
 */
export async function syncPropertyStatsFromReviews(
  queryClient: QueryClient,
  propertyId: string,
): Promise<Property | null> {
  const [property, reviews] = await Promise.all([
    getProperty(propertyId),
    getReviewsForProperty(propertyId),
  ]);

  if (!property) return null;

  const stats = computePropertyStats(reviews);
  const merged: Property = {
    ...property,
    ...stats,
  };

  patchPropertyInCaches(queryClient, propertyId, () => merged);

  for (const sort of REVIEW_SORTS) {
    queryClient.setQueryData(['reviews', 'property', propertyId, sort], sortReviews(reviews, sort));
  }

  return merged;
}
