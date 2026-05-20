import Constants from 'expo-constants';

type Extra = {
  firebase?: Record<string, string | undefined>;
  googlePlacesApiKey?: string;
  useEmulators?: boolean;
};

/** Expo inlines EXPO_PUBLIC_* at bundle time; extra is a fallback from app.config.ts */
function publicEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value === 'string' && value.length > 0) return value;
  return undefined;
}

const extra = Constants.expoConfig?.extra as Extra | undefined;

export const firebaseEnv = {
  apiKey:
    publicEnv('EXPO_PUBLIC_FIREBASE_API_KEY') ?? extra?.firebase?.apiKey,
  authDomain:
    publicEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN') ?? extra?.firebase?.authDomain,
  projectId:
    publicEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID') ?? extra?.firebase?.projectId,
  storageBucket:
    publicEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') ?? extra?.firebase?.storageBucket,
  messagingSenderId:
    publicEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') ??
    extra?.firebase?.messagingSenderId,
  appId: publicEnv('EXPO_PUBLIC_FIREBASE_APP_ID') ?? extra?.firebase?.appId,
};

export const googlePlacesApiKey =
  publicEnv('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY') ?? extra?.googlePlacesApiKey;

export const useFirebaseEmulators =
  publicEnv('EXPO_PUBLIC_USE_FIREBASE_EMULATORS') === 'true' || extra?.useEmulators === true;

/** True when real Firebase web config is present (not demo placeholders). */
export const isFirebaseConfigured = Boolean(
  firebaseEnv.apiKey &&
    firebaseEnv.projectId &&
    firebaseEnv.appId &&
    firebaseEnv.apiKey !== 'demo-api-key' &&
    !firebaseEnv.apiKey.startsWith('your_'),
);
