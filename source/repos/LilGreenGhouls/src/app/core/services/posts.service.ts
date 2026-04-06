import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from '@angular/fire/firestore';
import { Post } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private firestore = inject(Firestore);
  private readonly collectionName = 'posts';

  async create(post: Omit<Post, 'id'>): Promise<string> {
    const colRef = collection(this.firestore, this.collectionName);
    const docRef = await addDoc(colRef, {
      ...post,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  async update(id: string, data: Partial<Post>): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async getById(id: string): Promise<Post | null> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Post;
  }

  async getBySlug(slug: string): Promise<Post | null> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Post;
  }

  async getAllPublished(): Promise<Post[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Post);
  }

  async getRecentPublished(count: number): Promise<Post[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(count),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Post);
  }

  async getAll(): Promise<Post[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('updatedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Post);
  }

  async getCountByStatus(status: 'draft' | 'published'): Promise<number> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('status', '==', status),
    );
    const snap = await getDocs(q);
    return snap.size;
  }
}
