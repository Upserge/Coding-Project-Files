import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db, isFirebaseConfigured } from '@/src/services/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('saved-properties', {
      name: 'Saved properties',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId || projectId === 'replace-with-eas-project-id') {
    console.warn('Set EAS_PROJECT_ID in .env for push notifications.');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function savePushPreferences(
  userId: string,
  options: { enabled: boolean; expoPushToken?: string | null },
): Promise<void> {
  if (!isFirebaseConfigured) return;

  await setDoc(
    doc(db, 'users', userId),
    {
      pushNotificationsEnabled: options.enabled,
      ...(options.expoPushToken != null
        ? { expoPushToken: options.expoPushToken }
        : options.enabled === false
          ? { expoPushToken: null }
          : {}),
    },
    { merge: true },
  );
}

export async function enablePushNotifications(userId: string): Promise<boolean> {
  const token = await registerForPushNotificationsAsync();
  if (!token) return false;

  await savePushPreferences(userId, { enabled: true, expoPushToken: token });
  return true;
}

export async function disablePushNotifications(userId: string): Promise<void> {
  await savePushPreferences(userId, { enabled: false, expoPushToken: null });
}
