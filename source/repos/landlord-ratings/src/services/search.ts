import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/src/services/firebase';
import { searchLandlords } from '@/src/services/landlords';
import { searchProperties } from '@/src/services/properties';
import { MOCK_REVIEWS } from '@/src/services/mockData';
import type { Landlord, Property } from '@/src/types';

export async function getPropertyIdsWithTag(tag: string): Promise<Set<string>> {
  if (!tag) return new Set();

  if (!isFirebaseConfigured) {
    return new Set(
      MOCK_REVIEWS.filter((r) => r.tags.includes(tag) && r.status === 'published').map(
        (r) => r.propertyId,
      ),
    );
  }

  const snap = await getDocs(
    query(
      collection(db, 'reviews'),
      where('status', '==', 'published'),
      where('tags', 'array-contains', tag),
    ),
  );
  return new Set(snap.docs.map((d) => d.data().propertyId as string));
}

export async function searchAll(input: {
  term: string;
  minRating?: number;
  tag?: string;
}): Promise<{ properties: Property[]; landlords: Landlord[] }> {
  const term = input.term.trim();
  const minRating = input.minRating ?? 0;
  const tag = input.tag?.trim();

  let properties = term.length >= 2 ? await searchProperties(term) : [];
  let landlords = term.length >= 2 ? await searchLandlords(term) : [];

  if (minRating > 0) {
    properties = properties.filter((p) => p.avgOverall >= minRating);
    landlords = landlords.filter((l) => l.avgOverall >= minRating);
  }

  if (tag) {
    const propertyIds = await getPropertyIdsWithTag(tag);
    properties = properties.filter((p) => propertyIds.has(p.id));

    if (!isFirebaseConfigured) {
      const landlordIds = new Set(
        MOCK_REVIEWS.filter((r) => r.tags.includes(tag) && r.landlordId).map((r) => r.landlordId!),
      );
      landlords = landlords.filter((l) => landlordIds.has(l.id));
    } else {
      const snap = await getDocs(
        query(
          collection(db, 'reviews'),
          where('status', '==', 'published'),
          where('tags', 'array-contains', tag),
        ),
      );
      const landlordIds = new Set(
        snap.docs.map((d) => d.data().landlordId as string | undefined).filter(Boolean),
      );
      landlords = landlords.filter((l) => landlordIds.has(l.id));
    }
  }

  return { properties, landlords };
}
