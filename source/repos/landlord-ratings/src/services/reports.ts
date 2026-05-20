import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/src/services/firebase';
import type { Report } from '@/src/types';
import { auth } from '@/src/services/firebase';

const MOCK_REPORTS: Report[] = [];

export async function submitReport(input: {
  targetType: Report['targetType'];
  targetId: string;
  reason: string;
  details?: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be signed in to report content.');

  const payload = {
    reporterId: user.uid,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    details: input.details?.trim() ?? null,
    createdAt: serverTimestamp(),
  };

  if (!isFirebaseConfigured) {
    MOCK_REPORTS.push({
      id: `report-${Date.now()}`,
      reporterId: payload.reporterId,
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
      details: input.details,
      createdAt: { toMillis: () => Date.now() } as Report['createdAt'],
    });
    return;
  }

  await addDoc(collection(db, 'reports'), payload);
}
