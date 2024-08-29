"use client"

import { useEffect } from "react"
import useFcmToken from "@/hooks/useFcmToken";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useSession } from "next-auth/react";

const sendTokenToServer = async (token: string, username: string) => {
  try {
    const response = await fetch('/api/register-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, username }),
    });

    if (response.ok) {
      console.log('Token sent to server');
    } else {
      console.error('Failed to send token to server.');
    }
  } catch (error) {
    console.error('An error occurred while sending the token to the server:', error);
  }
};

export function TokenProvider({ children, ...props }: any) {
  const { fcmToken } = useFcmToken();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && fcmToken && session.user?.username) {
      console.log('Sending token to server...');
      sendTokenToServer(fcmToken, session.user.username);
    }
  }, [fcmToken, session, status]);

  return <>{children}</>;
}
