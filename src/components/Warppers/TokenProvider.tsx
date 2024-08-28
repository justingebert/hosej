"use client"

import {useEffect} from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import useFcmToken from "@/hooks/useFcmToken";
import { useUser } from "../UserContext";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

const sendTokenToServer = async (token: string, username:string) => {
    try {
      const response = await fetch('/api/register-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token, username: username }),
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

export function TokenProvider({ children, ...props }:any) {
    const { fcmToken, notificationPermissionStatus } = useFcmToken();
    const { session, status, user } = useAuthRedirect();

    useEffect(() => {
      if(status === "loading") return;
      if (fcmToken) {
        sendTokenToServer(fcmToken, user.username);
      }
    }, [fcmToken, user]);

  return <>{children}</>
}
