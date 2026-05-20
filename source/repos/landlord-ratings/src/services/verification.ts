import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, isFirebaseConfigured, storage } from '@/src/services/firebase';
import type { TenancyVerification, VerificationStatus } from '@/src/types';
import { auth } from '@/src/services/firebase';

const MAX_BYTES = 5 * 1024 * 1024;

export async function getVerification(userId: string): Promise<TenancyVerification | null> {
  if (!isFirebaseConfigured) return null;

  const snap = await getDoc(doc(db, 'verifications', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as TenancyVerification;
}

export async function uploadTenancyVerification(localUri: string): Promise<TenancyVerification> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to upload verification.');

  const response = await fetch(localUri);
  const blob = await response.blob();

  if (blob.size > MAX_BYTES) {
    throw new Error('Image must be under 5 MB. Try a smaller photo.');
  }

  if (!blob.type.startsWith('image/')) {
    throw new Error('Please upload an image (lease page, utility bill, or similar).');
  }

  const ext = blob.type.includes('png') ? 'png' : 'jpg';
  const storagePath = `uploads/${user.uid}/verification/document.${ext}`;
  const storageRef = ref(storage, storagePath);

  if (!isFirebaseConfigured) {
    return {
      id: user.uid,
      userId: user.uid,
      status: 'pending',
      storagePath,
      createdAt: { toMillis: () => Date.now() } as TenancyVerification['createdAt'],
      updatedAt: { toMillis: () => Date.now() } as TenancyVerification['updatedAt'],
    };
  }

  await uploadBytes(storageRef, blob, { contentType: blob.type });
  const downloadUrl = await getDownloadURL(storageRef);

  const payload = {
    userId: user.uid,
    status: 'pending' as VerificationStatus,
    storagePath,
    downloadUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'verifications', user.uid), payload, { merge: true });

  const snap = await getDoc(doc(db, 'verifications', user.uid));
  return { id: user.uid, ...snap.data()! } as TenancyVerification;
}
