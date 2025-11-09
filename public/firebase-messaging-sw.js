// Firebase Cloud Messaging Service Worker
// This file must be in the public folder to be accessible as a service worker

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCAzJf4xhj8YHT6ArbmVdzkOpGKwFTHkCU",
  authDomain: "wasilah-new.firebaseapp.com",
  projectId: "wasilah-new",
  storageBucket: "wasilah-new.firebasestorage.app",
  messagingSenderId: "577353648201",
  appId: "1:577353648201:web:322c63144b84db4d2c5798"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Wasillah Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/logo.jpeg',
    badge: '/logo.jpeg',
    tag: payload.data?.notificationId || 'notification',
    data: payload.data,
    requireInteraction: false,
    actions: payload.data?.actionUrl ? [
      {
        action: 'open',
        title: 'View'
      }
    ] : []
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data;
  const actionUrl = data?.actionUrl || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === actionUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});

