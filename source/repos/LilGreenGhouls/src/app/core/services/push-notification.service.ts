import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from '@angular/fire/firestore';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { environment } from '../../../environments/environment';

export interface FcmTokenDoc {
  token: string;
  subscriberEmail: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NotificationRequest {
  title: string;
  body: string;
  link: string;
  status: 'pending' | 'sent' | 'failed';
  tokenCount: number;
  createdAt: Timestamp;
}

export class FcmError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'FcmError';
  }
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private firestore = inject(Firestore);
  private messaging = inject(Messaging);
  private readonly collectionName = 'fcmTokens';
  private readonly notificationsCollection = 'notificationRequests';

  /**
   * Request notification permission and save the FCM token to Firestore.
   * Optionally associates the token with a subscriber email.
   */
  async requestPermissionAndSaveToken(subscriberEmail?: string): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied.');
        return null;
      }

      const token = await getToken(this.messaging, {
        vapidKey: environment.firebase.vapidKey,
      });

      if (!token) {
        console.warn('No FCM token received.');
        return null;
      }

      // Save token to Firestore (use token as doc ID for deduplication)
      const ref = doc(this.firestore, this.collectionName, token);
      await setDoc(ref, {
        token,
        subscriberEmail: subscriberEmail ?? null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true });

      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  /**
   * Listen for foreground messages and run a callback.
   */
  onForegroundMessage(callback: (payload: unknown) => void): void {
    onMessage(this.messaging, (payload) => {
      callback(payload);
    });
  }

  /**
   * Get all stored FCM tokens (admin use — for sending notifications).
   */
  async getAllTokens(): Promise<string[]> {
    const snap = await getDocs(collection(this.firestore, this.collectionName));
    return snap.docs.map(d => d.data()['token'] as string).filter(Boolean);
  }

  /**
   * Queue a push notification request for all subscribers.
   *
   * Writes a document to the `notificationRequests` Firestore collection
   * with status 'pending'. A Cloud Function or external server should watch
   * this collection and send the actual FCM messages via the Admin SDK.
   *
   * This approach avoids exposing server keys in client-side code and works
   * with the deprecated legacy FCM HTTP API being shut down.
   *
   * Returns the number of FCM tokens that the notification targets.
   */
  async sendToAllSubscribers(title: string, body: string, link: string): Promise<number> {
    let tokens: string[];
    try {
      tokens = await this.getAllTokens();
    } catch (error: unknown) {
      throw new FcmError(
        'Failed to retrieve subscriber tokens. Check Firestore permissions.',
        'fcm/token-retrieval-failed',
      );
    }

    if (tokens.length === 0) return 0;

    try {
      // Write a notification request to Firestore for backend processing
      await addDoc(collection(this.firestore, this.notificationsCollection), {
        title,
        body,
        link,
        status: 'pending',
        tokenCount: tokens.length,
        createdAt: Timestamp.now(),
      } satisfies NotificationRequest);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code ?? 'unknown';
      if (code === 'permission-denied') {
        throw new FcmError(
          'Permission denied writing notification request. Verify admin authentication.',
          'fcm/permission-denied',
        );
      }
      throw new FcmError(
        'Failed to queue notification request to Firestore.',
        'fcm/queue-failed',
      );
    }

    return tokens.length;
  }
}
