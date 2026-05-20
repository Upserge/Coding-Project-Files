import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/** Navigate when user taps a saved-property push notification. */
export function PushNotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        propertyId?: string;
        type?: string;
      };

      if (data?.type === 'saved_property_review' && data.propertyId) {
        router.push(`/property/${data.propertyId}`);
      }
    });

    return () => sub.remove();
  }, [router]);

  return null;
}
