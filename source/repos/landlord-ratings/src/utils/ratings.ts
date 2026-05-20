import type { CategoryScores, Review, ReviewCategory } from '@/src/types';
import { REVIEW_CATEGORIES } from '@/src/types';

export function averageCategoryScores(reviews: Review[]): Partial<CategoryScores> {
  if (reviews.length === 0) return {};

  const sums: Partial<Record<ReviewCategory, number>> = {};
  const counts: Partial<Record<ReviewCategory, number>> = {};

  for (const review of reviews) {
    for (const key of REVIEW_CATEGORIES) {
      const value = review.categories[key];
      if (value == null) continue;
      sums[key] = (sums[key] ?? 0) + value;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  const averages: Partial<CategoryScores> = {};
  for (const key of REVIEW_CATEGORIES) {
    if (counts[key]) {
      averages[key] = Math.round(((sums[key] ?? 0) / (counts[key] ?? 1)) * 10) / 10;
    }
  }
  return averages;
}

export function formatRating(value: number | undefined): string {
  if (value == null || value === 0) return '—';
  return value.toFixed(1);
}

export type ReviewSort = 'newest' | 'highest' | 'lowest';

export function sortReviews(reviews: Review[], sort: ReviewSort): Review[] {
  const copy = [...reviews];
  switch (sort) {
    case 'highest':
      return copy.sort((a, b) => b.overall - a.overall);
    case 'lowest':
      return copy.sort((a, b) => a.overall - b.overall);
    default:
      return copy.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }
}
