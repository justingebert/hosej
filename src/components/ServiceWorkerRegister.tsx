// components/ServiceWorkerRegister.tsx
"use client";

import { useEffect } from 'react';

const ServiceWorkerRegister = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register the Firebase service worker
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Firebase Service Worker registered with scope:', registration.scope);
        }).catch((error) => {
          console.error('Firebase Service Worker registration failed:', error);
        });

      // Register the PWA service worker using workbox
      //@ts-ignore
      if (window.workbox) {
        //@ts-ignore
        window.workbox.register()
          .then((registration:any) => {
            console.log('PWA Service Worker registered with scope:', registration.scope);
          }).catch((error:any) => {
            console.error('PWA Service Worker registration failed:', error);
          });
      } else {
        console.error('Workbox is not available on window');
      }
    }
  }, []);

  return null;
};

export default ServiceWorkerRegister;
