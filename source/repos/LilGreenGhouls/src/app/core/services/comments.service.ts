import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionGroup,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from '@angular/fire/firestore';
import { Comment } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private firestore = inject(Firestore);

  private commentsCol(postId: string) {
    return collection(this.firestore, 'posts', postId, 'comments');
  }

  async addComment(postId: string, data: Pick<Comment, 'authorName' | 'authorEmail' | 'content'>): Promise<string> {
    const colRef = this.commentsCol(postId);
    const docRef = await addDoc(colRef, {
      ...data,
      postId,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  }

  async getApproved(postId: string): Promise<Comment[]> {
    const q = query(
      this.commentsCol(postId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Comment);
  }

  async getAllPending(): Promise<Comment[]> {
    const q = query(
      collectionGroup(this.firestore, 'comments'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Comment);
  }

  async updateStatus(postId: string, commentId: string, status: 'approved' | 'rejected'): Promise<void> {
    const docRef = doc(this.firestore, 'posts', postId, 'comments', commentId);
    await updateDoc(docRef, { status });
  }
}
