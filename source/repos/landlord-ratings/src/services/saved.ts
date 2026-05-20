import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/src/services/firebase';
import type { SavedItem, SavedItemType } from '@/src/types';
import { MOCK_SAVED } from '@/src/services/mockData';

function savedCollection(userId: string) {
  return collection(db, 'saved', userId, 'items');
}

export async function getSavedItems(userId: string): Promise<SavedItem[]> {
  if (!isFirebaseConfigured) {
    return MOCK_SAVED.filter((s) => s.id.startsWith(userId));
  }

  const snap = await getDocs(
    query(savedCollection(userId), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedItem);
}

export async function saveItem(
  userId: string,
  item: Omit<SavedItem, 'id' | 'createdAt'>,
): Promise<void> {
  const id = `${item.type}_${item.refId}`;

  if (!isFirebaseConfigured) {
    const existing = MOCK_SAVED.find((s) => s.id === `${userId}_${id}`);
    if (!existing) {
      MOCK_SAVED.push({
        id: `${userId}_${id}`,
        ...item,
        createdAt: { toMillis: () => Date.now() } as SavedItem['createdAt'],
      });
    }
    return;
  }

  await setDoc(doc(savedCollection(userId), id), {
    ...item,
    createdAt: serverTimestamp(),
  });
}

export async function removeSavedItem(userId: string, itemId: string): Promise<void> {
  if (!isFirebaseConfigured) {
    const idx = MOCK_SAVED.findIndex((s) => s.id === `${userId}_${itemId}` || s.id === itemId);
    if (idx >= 0) MOCK_SAVED.splice(idx, 1);
    return;
  }

  await deleteDoc(doc(savedCollection(userId), itemId));
}

export async function isItemSaved(
  userId: string,
  type: SavedItemType,
  refId: string,
): Promise<boolean> {
  const id = `${type}_${refId}`;
  const items = await getSavedItems(userId);
  return items.some((i) => i.id === id || (i.type === type && i.refId === refId));
}
