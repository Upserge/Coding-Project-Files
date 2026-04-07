/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// Handles background push notifications when the app is not in focus.

importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDQqN7qNyxytCrYH1k9mlBYXY2Ev4jv1NQ',
  authDomain: 'lilgreenghouls-fd542.firebaseapp.com',
  projectId: 'lilgreenghouls-fd542',
  storageBucket: 'lilgreenghouls-fd542.firebasestorage.app',
  messagingSenderId: '773239377928',
  appId: '1:773239377928:web:c9e2c77c70b701debfc1bd',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '👻 Lil Green Ghouls';
  const options = {
    body: payload.notification?.body || 'Something spooky just happened!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { link: payload.data?.link || '/' },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return clients.openWindow(link);
    }),
  );
});
