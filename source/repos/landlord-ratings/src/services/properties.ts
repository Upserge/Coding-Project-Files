import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
  orderBy,
  GeoPoint,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/src/services/firebase';
import type { Property } from '@/src/types';
import { encodeGeohash, getGeohashQueryBounds } from '@/src/utils/geohash';
import { MOCK_PROPERTIES } from '@/src/services/mockData';

function mapProperty(id: string, data: Record<string, unknown>): Property {
  return { id, ...(data as Omit<Property, 'id'>) };
}

export async function getProperty(id: string): Promise<Property | null> {
  if (!isFirebaseConfigured) {
    return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
  }
  const snap = await getDoc(doc(db, 'properties', id));
  if (!snap.exists()) return null;
  return mapProperty(snap.id, snap.data());
}

export async function findPropertyByPlaceId(placeId: string): Promise<Property | null> {
  if (!isFirebaseConfigured) {
    return MOCK_PROPERTIES.find((p) => p.placeId === placeId) ?? null;
  }
  const q = query(collection(db, 'properties'), where('placeId', '==', placeId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return mapProperty(docSnap.id, docSnap.data());
}

export async function upsertProperty(input: {
  placeId?: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  landlordId?: string;
}): Promise<Property> {
  const geohash = encodeGeohash(input.latitude, input.longitude);
  const location = new GeoPoint(input.latitude, input.longitude);

  if (!isFirebaseConfigured) {
    const existing = MOCK_PROPERTIES.find(
      (p) => p.placeId === input.placeId || p.formattedAddress === input.formattedAddress,
    );
    if (existing) return existing;
    const created: Property = {
      id: `mock-${Date.now()}`,
      placeId: input.placeId,
      formattedAddress: input.formattedAddress,
      location,
      geohash,
      avgOverall: 0,
      reviewCount: 0,
      categoryAverages: {},
      landlordId: input.landlordId,
      updatedAt: Timestamp.now(),
    };
    MOCK_PROPERTIES.push(created);
    return created;
  }

  if (input.placeId) {
    const existing = await findPropertyByPlaceId(input.placeId);
    if (existing) return existing;
  }

  const ref = doc(collection(db, 'properties'));
  const data = {
    placeId: input.placeId ?? null,
    formattedAddress: input.formattedAddress,
    location,
    geohash,
    avgOverall: 0,
    reviewCount: 0,
    categoryAverages: {},
    landlordId: input.landlordId ?? null,
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  const snap = await getDoc(ref);
  return mapProperty(ref.id, snap.data()!);
}

export async function getPropertiesNearby(
  latitude: number,
  longitude: number,
  radiusKm = 10,
): Promise<Property[]> {
  if (!isFirebaseConfigured) {
    return MOCK_PROPERTIES;
  }

  const bounds = getGeohashQueryBounds([latitude, longitude], radiusKm);
  const results: Property[] = [];
  const seen = new Set<string>();

  for (const [start, end] of bounds) {
    const q = query(
      collection(db, 'properties'),
      orderBy('geohash'),
      where('geohash', '>=', start),
      where('geohash', '<=', end),
    );
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      if (seen.has(docSnap.id)) continue;
      seen.add(docSnap.id);
      results.push(mapProperty(docSnap.id, docSnap.data()));
    }
  }

  return results;
}
