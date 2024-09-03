import { useEffect, useRef, useState } from 'react';
import { getToken, onMessage, Unsubscribe } from "firebase/messaging";
import { toast } from "sonner";
import { messaging, fetchToken} from '@/firebase';

async function requestPermissionReturnToken() {
  if(!("Notification" in window)) {
    console.log("This browser does not support notifications.");
    return null;
  }
  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const currentToken = await fetchToken();
      return currentToken;
    } else {
      console.log("Notification permission not granted.");
      return null;
    }
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

const useFcmToken = (isAuthenticated: boolean, isRegistered: boolean) => {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | null>(null);
  const retryLoadToken = useRef(0);
  const isLoading = useRef(false);

  const loadToken = async () => {
    if (isLoading.current || !isAuthenticated || !isRegistered) return;

    isLoading.current = true;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        const currentToken = await requestPermissionReturnToken();
        if (currentToken) {
          setToken(currentToken);
          setNotificationPermissionStatus(Notification.permission);
        } else {
          handleTokenLoadError();
        }
      }
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }

    isLoading.current = false;
  };

  const handleTokenLoadError = async () => {
    if (retryLoadToken.current >= 3) {
      console.info(
        "%cPush Notifications issue - unable to load token after 3 retries",
        "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
      );
      return;
    }
    retryLoadToken.current += 1;
    console.error("An error occurred while retrieving token. Retrying...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    isLoading.current = false;
    await loadToken();
  };

  useEffect(() => {
    if (isAuthenticated && isRegistered) {
      loadToken();
    }
  }, [isAuthenticated, isRegistered]);

  useEffect(() => {
    const setupListener = async () => {
      if (!token || Notification.permission !== "granted") return;

      //console.log(`onMessage registered with token ${token}`);
      const m = await messaging();
      if (!m) return;

      const unsubscribe = onMessage(m, (payload) => {
        console.log("Foreground push notification received:", payload);
        const notification = new Notification(payload.data?.title || "New message", {
          body: payload.data?.body || "This is a new message",
        });
      });

      return unsubscribe;
    };

    let unsubscribe: Unsubscribe | null = null;

    setupListener().then((unsub) => {
      if (unsub) {
        unsubscribe = unsub;
      }
    });

    return () => unsubscribe?.();
  }, [token]);

  return { fcmToken: token, notificationPermissionStatus };
};

export default useFcmToken;