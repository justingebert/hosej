// components/ServiceWorkerRegister.tsx
"use client";

import { useEffect } from 'react';

const ServiceWorkerRegister = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Firebase Service Worker registered with scope:', registration.scope);
        }).catch((error) => {
          console.error('Firebase Service Worker registration failed:', error);
        });

      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('PWA Service Worker registered with scope:', registration.scope);
        }).catch((error) => {
          console.error('PWA Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
};

export default ServiceWorkerRegister;
