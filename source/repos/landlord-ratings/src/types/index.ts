import type { Timestamp, GeoPoint } from 'firebase/firestore';

export type ReviewStatus = 'pending' | 'published' | 'rejected';
export type LandlordType = 'individual' | 'company' | 'property_manager';
export type SavedItemType = 'property' | 'landlord';

export const REVIEW_CATEGORIES = [
  'overall',
  'responsiveness',
  'maintenance',
  'safety',
  'value',
  'leaseFairness',
] as const;

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

export type CategoryScores = Record<ReviewCategory, number>;

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  reviewCount: number;
}

export interface Property {
  id: string;
  placeId?: string;
  formattedAddress: string;
  location: GeoPoint;
  geohash: string;
  avgOverall: number;
  reviewCount: number;
  categoryAverages: Partial<CategoryScores>;
  landlordId?: string;
  updatedAt: Timestamp;
}

export interface Landlord {
  id: string;
  name: string;
  type: LandlordType;
  avgOverall: number;
  reviewCount: number;
  propertyIds: string[];
  updatedAt: Timestamp;
}

export interface Review {
  id: string;
  userId: string;
  userDisplayName: string;
  propertyId: string;
  landlordId?: string;
  moveIn: string;
  moveOut?: string;
  isCurrent: boolean;
  overall: number;
  categories: CategoryScores;
  body: string;
  tags: string[];
  status: ReviewStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'review' | 'property' | 'landlord';
  targetId: string;
  reason: string;
  details?: string;
  createdAt: Timestamp;
}

export interface SavedItem {
  id: string;
  type: SavedItemType;
  refId: string;
  title: string;
  subtitle?: string;
  avgOverall?: number;
  createdAt: Timestamp;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface CreateReviewInput {
  propertyId: string;
  landlordId?: string;
  moveIn: string;
  moveOut?: string;
  isCurrent: boolean;
  categories: CategoryScores;
  body: string;
  tags: string[];
}
