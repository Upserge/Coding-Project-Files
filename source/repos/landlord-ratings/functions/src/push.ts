const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
}

/** Send up to 100 Expo push messages per request (Expo API limit). */
export async function sendExpoPushBatch(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const chunkSize = 100;
  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Expo push failed', res.status, text);
    }
  }
}
