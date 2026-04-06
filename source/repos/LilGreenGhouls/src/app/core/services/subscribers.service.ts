import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from '@angular/fire/firestore';
import { Subscriber } from '../models/subscriber.model';

@Injectable({ providedIn: 'root' })
export class SubscribersService {
  private firestore = inject(Firestore);
  private readonly collectionName = 'subscribers';

  async addSubscriber(email: string, displayName?: string, uid?: string): Promise<void> {
    // Check if email already exists
    const q = query(
      collection(this.firestore, this.collectionName),
      where('email', '==', email),
    );
    const existing = await getDocs(q);
    if (!existing.empty) return; // Already subscribed

    const colRef = collection(this.firestore, this.collectionName);
    await addDoc(colRef, {
      email,
      displayName: displayName ?? null,
      uid: uid ?? null,
      subscribedAt: Timestamp.now(),
      active: true,
    });
  }

  async getAll(): Promise<Subscriber[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('subscribedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Subscriber);
  }

  async getActiveCount(): Promise<number> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('active', '==', true),
    );
    const snap = await getDocs(q);
    return snap.size;
  }

  async remove(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
