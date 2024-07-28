"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { History } from "lucide-react";
import Link from "next/link";
import useFcmToken from "../../hooks/useFcmToken";
import { getMessaging, onMessage } from 'firebase/messaging';
import app from "@/firebase";

const sendTokenToServer = async (token: string) => {
  try {
    const response = await fetch('/api/register-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: token }),
    });

    if (response.ok) {
      console.log('Token sent to server successfully.');
    } else {
      console.error('Failed to send token to server.');
    }
  } catch (error) {
    console.error('An error occurred while sending the token to the server:', error);
  }
};

export default function Home() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { fcmToken, notificationPermissionStatus } = useFcmToken();

  useEffect(() => {
    if (fcmToken) {
      sendTokenToServer(fcmToken);
    }
  }, [fcmToken]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    console.log("user:", user);
    if (!user) {
      router.push("/signin");
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const messaging = getMessaging(app);
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground push notification received:', payload);
        // Handle the received push notification while the app is in the foreground
        // You can display a notification or update the UI based on the payload
      });
      return () => {
        unsubscribe(); // Unsubscribe from the onMessage event
      };
    }

  }, [router]);

  return (
    <div className="flex flex-col justify-between min-h-screen">
      <div className="flex justify-between items-center mt-4 w-full">
      <div className="">
      <Button variant="outline" size="icon" onClick={() => {router.push("/dashboard/history")}}>
        <History />
      </Button>
      </div>
        <Link href="/dashboard/stats">
          <h1 className="text-4xl font-bold">HoseJ</h1>
        </Link>
        <div className="">
          <Button variant="outline" size="icon" onClick={() => {router.push("/dashboard/leaderboard")}}>
          👖
        </Button>
        </div>
      </div>
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-20">
          <Button
            className="p-8 font-bold text-lg"
            onClick={() => router.push("/dashboard/rally")}
          >
            Rally
          </Button>
          <Button
            className="p-8 font-bold text-lg"
            onClick={() => router.push("/dashboard/daily")}
          >
            Daily
          </Button>
        </div>
      </div>
      <div className=" flex justify-center">
        <Button
          variant={"secondary"}
          className="absolute bottom-20"
          onClick={() => router.push("/dashboard/create")}
        >
          Create
        </Button>
      </div>
      <Button className="mb-10" onClick={async () => {
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: '🚨HoseJ Rally', body: '🚨JETZT VOTEN DU FISCH🚨' }),
          cache: 'no-cache',
        });
      }}>
        sendNot
      </Button>
    </div>
  );
}
