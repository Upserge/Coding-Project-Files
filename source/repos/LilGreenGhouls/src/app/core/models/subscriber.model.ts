import { Timestamp } from 'firebase/firestore';
import { SubscriberPreferences } from './subscriber-preferences.model';

export interface Subscriber {
  id?: string;
  email: string;
  displayName: string | null;
  subscribedAt: Timestamp;
  uid: string | null;
  active: boolean;
  preferences?: SubscriberPreferences;
}
