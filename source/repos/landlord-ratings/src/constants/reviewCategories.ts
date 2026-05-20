import type { ReviewCategory } from '@/src/types';

export const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  overall: 'Overall experience',
  responsiveness: 'Responsiveness',
  maintenance: 'Maintenance & repairs',
  safety: 'Safety & condition',
  value: 'Value for rent',
  leaseFairness: 'Lease & deposit fairness',
};

export const SUGGESTED_TAGS = [
  'responsive',
  'slowRepairs',
  'noisy',
  'petFriendly',
  'mold',
  'greatLocation',
  'depositIssues',
  'wouldRentAgain',
] as const;

export const PROHIBITED_TAG_PATTERNS = [
  /race/i,
  /religion/i,
  /nationality/i,
  /disability/i,
  /family/i,
  /gender/i,
  /sexual/i,
];

// TODO: change this back to 50 when done testing
export const MIN_REVIEW_LENGTH = 1;
