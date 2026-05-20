import { GeoPoint, Timestamp } from 'firebase/firestore';
import type { Landlord, Property, Review, SavedItem } from '@/src/types';

const now = Timestamp.now();

export const MOCK_LANDLORDS: Landlord[] = [
  {
    id: 'landlord-1',
    name: 'Greenfield Property Management',
    type: 'property_manager',
    avgOverall: 3.8,
    reviewCount: 12,
    propertyIds: ['prop-1', 'prop-2'],
    updatedAt: now,
  },
  {
    id: 'landlord-2',
    name: 'Jane Smith',
    type: 'individual',
    avgOverall: 4.5,
    reviewCount: 4,
    propertyIds: ['prop-3'],
    updatedAt: now,
  },
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    placeId: 'mock-chicago-1',
    formattedAddress: '123 Main St, Chicago, IL 60601',
    location: new GeoPoint(41.8819, -87.6278),
    geohash: 'dp3wj0k',
    avgOverall: 3.6,
    reviewCount: 8,
    categoryAverages: { overall: 3.6, maintenance: 3.2, responsiveness: 3.8 },
    landlordId: 'landlord-1',
    updatedAt: now,
  },
  {
    id: 'prop-2',
    placeId: 'mock-chicago-2',
    formattedAddress: '456 Oak Ave, Chicago, IL 60602',
    location: new GeoPoint(41.885, -87.62),
    geohash: 'dp3wj0m',
    avgOverall: 4.2,
    reviewCount: 5,
    categoryAverages: { overall: 4.2, value: 4.5 },
    landlordId: 'landlord-1',
    updatedAt: now,
  },
  {
    id: 'prop-3',
    formattedAddress: '789 Lake Shore Dr, Chicago, IL 60611',
    location: new GeoPoint(41.89, -87.61),
    geohash: 'dp3wj0q',
    avgOverall: 4.7,
    reviewCount: 3,
    categoryAverages: { overall: 4.7 },
    landlordId: 'landlord-2',
    updatedAt: now,
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'review-1',
    userId: 'demo-user',
    userDisplayName: 'Alex R.',
    propertyId: 'prop-1',
    landlordId: 'landlord-1',
    moveIn: '2022-08-01',
    moveOut: '2024-07-31',
    isCurrent: false,
    overall: 4,
    categories: {
      overall: 4,
      responsiveness: 4,
      maintenance: 3,
      safety: 4,
      value: 4,
      leaseFairness: 4,
    },
    body: 'Generally a solid building. Maintenance can be slow in winter but the management team is polite and professional. Would rent again if the price stays reasonable.',
    tags: ['responsive', 'slowRepairs'],
    status: 'published',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'review-2',
    userId: 'demo-user-2',
    userDisplayName: 'Sam T.',
    propertyId: 'prop-2',
    landlordId: 'landlord-1',
    moveIn: '2023-01-15',
    moveOut: undefined,
    isCurrent: true,
    overall: 5,
    categories: {
      overall: 5,
      responsiveness: 5,
      maintenance: 5,
      safety: 4,
      value: 4,
      leaseFairness: 5,
    },
    body: 'Best rental experience I have had in Chicago. Quick responses, fair lease terms, and the unit was move-in ready. Highly recommend for young professionals.',
    tags: ['wouldRentAgain', 'greatLocation'],
    status: 'published',
    createdAt: now,
    updatedAt: now,
  },
];

export const MOCK_SAVED: SavedItem[] = [];
