import { Timestamp } from 'firebase/firestore';

export interface Subscriber {
  id?: string;
  email: string;
  displayName: string | null;
  subscribedAt: Timestamp;
  uid: string | null;
  active: boolean;
}
