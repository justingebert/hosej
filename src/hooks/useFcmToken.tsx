import { useEffect, useRef, useState } from 'react';
import { getToken, onMessage, Unsubscribe } from "firebase/messaging";
import { toast } from "sonner";
import { messaging, fetchToken} from '@/firebase';

async function requestPermissionReturnToken() {
  if(!("Notification" in window)) {
    console.log("This browser does not support notifications.");
    return null;
  }
  if(Notification.permission === "granted") {
    const currentToken = await fetchToken();
    return currentToken;
  }
  if(Notification.permission === "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const currentToken = await fetchToken();
      return currentToken;
    }
  }
  console.log("Notification permission not granted.");
  return null;
}


const useFcmToken = () => {
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
  useState<NotificationPermission | null>(null); // notification permission status.
  const [token, setToken] = useState<string | null>(null); 
  const retryLoadToken = useRef(0); // retry attempts.
  const isLoading = useRef(false); // token fetch is currently in progress.

  const loadToken = async () => {
    //Prevent multiple fetches if already fetched or in progress.
    if (isLoading.current) return;

    isLoading.current = true; 
    const token = await requestPermissionReturnToken(); 

    //permission is denied
    if (Notification.permission === "denied") {
      setNotificationPermissionStatus("denied");
      console.info(
        "%cPush Notifications issue - permission denied",
        "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
      );
      isLoading.current = false;
      return;
    }
    if (!token) {
      if (retryLoadToken.current >= 3) {
        alert("Unable to load token, refresh the app");
        console.info(
          "%cPush Notifications issue - unable to load token after 3 retries",
          "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
        )
        isLoading.current = false
        return
      }

      retryLoadToken.current += 1;
      console.error("An error occurred while retrieving token. Retrying...")
      isLoading.current = false;
      await loadToken();
      return;
    }
    setNotificationPermissionStatus(Notification.permission);
    setToken(token);
    isLoading.current = false;
  };

  useEffect(() => {
    if ("Notification" in window) {
      loadToken();
    }
  }, []);

  useEffect(() => {
    const setupListener = async () => {
      if (!token) return; // Exit if no token is available.

      console.log(`onMessage registered with token ${token}`);
      const m = await messaging();
      if (!m) return;

      // Register a listener for incoming FCM messages.
      const unsubscribe = onMessage(m, (payload) => {
        if (Notification.permission !== "granted") return;

        console.log("Foreground push notification received:", payload);
        const link = payload.fcmOptions?.link || payload.data?.link;

    
        const n = new Notification(
          payload.notification?.title || "New message",
          {
            body: payload.notification?.body || "This is a new message",
          }
        );

      });

      return unsubscribe;
    };

    let unsubscribe: Unsubscribe | null = null;

    setupListener().then((unsub) => {
      if (unsub) {
        unsubscribe = unsub;
      }
    });

    // Cleanup the listener when the component unmounts.
    return () => unsubscribe?.();
  }, [token, toast]);

  return { fcmToken:token, notificationPermissionStatus };
};

export default useFcmToken;