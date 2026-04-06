import { Timestamp } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'admin' | 'viewer';
  createdAt: Timestamp;
  lastLogin: Timestamp;
}
