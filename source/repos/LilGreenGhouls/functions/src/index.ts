import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging, SendResponse } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();

const firestore = getFirestore();
const messaging = getMessaging();
const TOKENS_COLLECTION = 'fcmTokens';
const MAX_TOKENS_PER_BATCH = 500;

interface NotificationRequest {
  title: string;
  body: string;
  link: string;
  status: 'pending' | 'sent' | 'failed';
}

interface TokenDoc {
  token?: string;
}

export const onNotificationRequestCreated = onDocumentCreated(
  'notificationRequests/{requestId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      return;
    }

    const request = snapshot.data() as Partial<NotificationRequest>;
    if (!isProcessableRequest(request)) {
      await snapshot.ref.update({
        status: 'failed',
        errorMessage: 'Notification request is missing title, body, or link.',
        failedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const tokens = await getTokens();
    if (!tokens.length) {
      await snapshot.ref.update({
        status: 'failed',
        sentCount: 0,
        failedCount: 0,
        errorMessage: 'No FCM tokens found.',
        processedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const result = await sendNotificationBatches(request, tokens);
    await deleteInvalidTokens(result.invalidTokens);

    await snapshot.ref.update({
      status: result.sentCount > 0 ? 'sent' : 'failed',
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      invalidTokenCount: result.invalidTokens.length,
      processedAt: FieldValue.serverTimestamp(),
      errorMessage: result.sentCount > 0 ? FieldValue.delete() : 'No notifications were delivered.',
    });

    logger.info('Processed notification request', {
      requestId: event.params['requestId'],
      tokenCount: tokens.length,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      invalidTokenCount: result.invalidTokens.length,
    });
  },
);

function isProcessableRequest(
  request: Partial<NotificationRequest>,
): request is NotificationRequest {
  return (
    request.status === 'pending' &&
    isNonEmptyString(request.title) &&
    isNonEmptyString(request.body) &&
    isNonEmptyString(request.link)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

async function getTokens(): Promise<string[]> {
  const snapshot = await firestore.collection(TOKENS_COLLECTION).get();
  return snapshot.docs
    .map(doc => (doc.data() as TokenDoc).token || doc.id)
    .filter(isNonEmptyString);
}

async function sendNotificationBatches(
  request: NotificationRequest,
  tokens: string[],
): Promise<{ sentCount: number; failedCount: number; invalidTokens: string[] }> {
  let sentCount = 0;
  let failedCount = 0;
  const invalidTokens: string[] = [];

  for (const batch of chunk(tokens, MAX_TOKENS_PER_BATCH)) {
    const response = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: {
        title: request.title,
        body: request.body,
      },
      data: {
        link: request.link,
      },
      webpush: {
        fcmOptions: {
          link: request.link,
        },
      },
    });

    sentCount += response.successCount;
    failedCount += response.failureCount;
    invalidTokens.push(...getInvalidTokens(batch, response.responses));
  }

  return { sentCount, failedCount, invalidTokens };
}

function getInvalidTokens(tokens: string[], responses: SendResponse[]): string[] {
  return responses
    .map((response, index) => ({
      token: tokens[index],
      code: response.error?.code,
    }))
    .filter(result => isInvalidTokenError(result.code))
    .map(result => result.token);
}

function isInvalidTokenError(code: string | undefined): boolean {
  return (
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/registration-token-not-registered'
  );
}

async function deleteInvalidTokens(tokens: string[]): Promise<void> {
  if (!tokens.length) {
    return;
  }

  const batch = firestore.batch();
  for (const token of tokens) {
    batch.delete(firestore.collection(TOKENS_COLLECTION).doc(token));
  }
  await batch.commit();
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}
