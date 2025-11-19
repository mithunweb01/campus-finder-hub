// Firebase Messaging SW (Service Worker)
importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDjW_3cYR8apPFMmZqLqZh_9i2bN-1IEmY",
  authDomain: "college-finder-279aa.firebaseapp.com",
  projectId: "college-finder-279aa",
  messagingSenderId: "94401695690",
  appId: "1:94401695690:web:380de91d4f168ea2944933",
});

// Background push handler
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "my-logo.png" // optional
  });
});
