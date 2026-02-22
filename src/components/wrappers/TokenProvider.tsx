"use client";

import { useEffect } from "react";
import useFcmToken from "@/hooks/useFcmToken";
import { useSession } from "next-auth/react";

const sendTokenToServer = async (token: string) => {
    try {
        const response = await fetch(`/api/users/push-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
        });

        if (response.ok) {
            console.log("Token sent to server");
            localStorage.setItem("lastSentFcmToken", token); // Store the token locally
        } else {
            console.error("Failed to send token to server.");
        }
    } catch (error) {
        console.error("An error occurred while sending the token to the server:", error);
    }
};

export function TokenProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";
    const isRegistered = session?.user && (session.user as any)._id;
    const { fcmToken } = useFcmToken(isAuthenticated, isRegistered);

    useEffect(() => {
        if (isAuthenticated && fcmToken && isRegistered) {
            const lastSentToken = localStorage.getItem("lastSentFcmToken");
            if (fcmToken !== lastSentToken) {
                console.log("Sending token to server...");
                sendTokenToServer(fcmToken);
            }
        }
    }, [fcmToken, session, isAuthenticated, isRegistered]);

    return <>{children}</>;
}
