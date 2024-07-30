"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { History } from "lucide-react";
import Link from "next/link";
import useFcmToken from "../hooks/useFcmToken";
import { useUser } from "@/components/UserContext"; 
import { Input } from "@/components/ui/input";

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
  const { username } = useUser();
  const notification = useRef({ title: '', body: '' });
  

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
      <div className="flex flex-col items-center justify-center flex-grow">
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
          {username === 'Justin' && (
            <div className="flex flex-col items-center gap-4 mt-10">
              <Input
                type="text"
                placeholder="Title"
                value={notification.current.title}
                onChange={(e) => notification.current.title = e.target.value}
                required
              />
              <Input
                type="text"
                placeholder="Body"
                value={notification.current.body}
                onChange={(e) => notification.current.body = e.target.value}
                required
              />
              <Button variant="destructive" onClick={async () => {
                await fetch('/api/send-notification', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ title: notification.current.title, body: notification.current.body }),
                  cache: 'no-cache',
                });
              }}>
                Send Notification
              </Button>
            </div>
          )}
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
      
    </div>
  );
}
