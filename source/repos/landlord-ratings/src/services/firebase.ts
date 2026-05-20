import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';
import {
  firebaseEnv,
  isFirebaseConfigured,
  useFirebaseEmulators,
} from '@/src/config/env';

export { isFirebaseConfigured };

const firebaseConfig = {
  apiKey: firebaseEnv.apiKey ?? 'demo-api-key',
  authDomain: firebaseEnv.authDomain ?? 'demo.firebaseapp.com',
  projectId: firebaseEnv.projectId ?? 'demo-project',
  storageBucket: firebaseEnv.storageBucket ?? 'demo.appspot.com',
  messagingSenderId: firebaseEnv.messagingSenderId ?? '123456789',
  appId: firebaseEnv.appId ?? '1:123456789:web:demo',
};

let app: FirebaseApp;

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0]!;
  }
  return app;
}

export const auth = getAuth(getFirebaseApp());
export const db = getFirestore(getFirebaseApp());
export const storage = getStorage(getFirebaseApp());
export const functions = getFunctions(getFirebaseApp());

if (useFirebaseEmulators && __DEV__) {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions, host, 5001);
}
