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

export default function Home() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { fcmToken, notificationPermissionStatus } = useFcmToken();
  // Use the token as needed
  fcmToken && console.log('FCM token:', fcmToken);

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
    <div className="flex flex-col h-screen justify-between">
      <div className="flex justify-center items-center mt-10 w-full relative">
      <div className="absolute left-10">
      <Button variant="outline" size="icon" onClick={() => {router.push("/dashboard/history")}}>
        <History />
      </Button>
      </div>
        <Link href="/dashboard/stats">
          <h1 className="text-4xl font-bold">HoseJ</h1>
        </Link>
        <div className="absolute right-10">
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
      <button>sendNot</button>
    </div>
  );
}
