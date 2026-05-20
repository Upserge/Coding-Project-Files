import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/src/services/firebase';
import type { Landlord, LandlordType } from '@/src/types';
import { MOCK_LANDLORDS } from '@/src/services/mockData';

function mapLandlord(id: string, data: Record<string, unknown>): Landlord {
  return { id, ...(data as Omit<Landlord, 'id'>) };
}

export async function getLandlord(id: string): Promise<Landlord | null> {
  if (!isFirebaseConfigured) {
    return MOCK_LANDLORDS.find((l) => l.id === id) ?? null;
  }
  const snap = await getDoc(doc(db, 'landlords', id));
  if (!snap.exists()) return null;
  return mapLandlord(snap.id, snap.data());
}

export async function searchLandlords(searchTerm: string): Promise<Landlord[]> {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return [];

  if (!isFirebaseConfigured) {
    return MOCK_LANDLORDS.filter((l) => l.name.toLowerCase().includes(term));
  }

  const snap = await getDocs(query(collection(db, 'landlords'), limit(50)));
  return snap.docs
    .map((d) => mapLandlord(d.id, d.data()))
    .filter((l) => l.name.toLowerCase().includes(term));
}

export async function createLandlord(input: {
  name: string;
  type: LandlordType;
}): Promise<Landlord> {
  if (!isFirebaseConfigured) {
    const created: Landlord = {
      id: `landlord-mock-${Date.now()}`,
      name: input.name,
      type: input.type,
      avgOverall: 0,
      reviewCount: 0,
      propertyIds: [],
      updatedAt: Timestamp.now(),
    };
    MOCK_LANDLORDS.push(created);
    return created;
  }

  const ref = doc(collection(db, 'landlords'));
  await setDoc(ref, {
    name: input.name,
    type: input.type,
    avgOverall: 0,
    reviewCount: 0,
    propertyIds: [],
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return mapLandlord(ref.id, snap.data()!);
}

export async function findLandlordByName(name: string): Promise<Landlord | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  if (!isFirebaseConfigured) {
    return MOCK_LANDLORDS.find((l) => l.name.toLowerCase() === normalized) ?? null;
  }

  const q = query(collection(db, 'landlords'), where('name', '==', name.trim()), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return mapLandlord(docSnap.id, docSnap.data());
}
