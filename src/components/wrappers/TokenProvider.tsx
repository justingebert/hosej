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
            localStorage.setItem("lastSentFcmToken", token);
        } else {
            console.error("Failed to send token to server.");
        }
    } catch (error) {
        console.error("An error occurred while sending the token to the server:", error);
    }
};

const HEARTBEAT_THROTTLE_MS = 5 * 60 * 1000;
const HEARTBEAT_STORAGE_KEY = "lastHeartbeatAt";

const sendHeartbeat = () => {
    try {
        const last = Number(localStorage.getItem(HEARTBEAT_STORAGE_KEY) || 0);
        if (Date.now() - last < HEARTBEAT_THROTTLE_MS) return;
        localStorage.setItem(HEARTBEAT_STORAGE_KEY, Date.now().toString());
    } catch {
        /* localStorage unavailable — fall through and send */
    }
    fetch(`/api/users/heartbeat`, { method: "POST" }).catch(() => {
        /* fire-and-forget */
    });
};

export function TokenProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";
    const isRegistered = !!(session?.user && session.user._id);
    const { fcmToken } = useFcmToken(isAuthenticated, isRegistered);

    useEffect(() => {
        if (isAuthenticated && fcmToken && isRegistered) {
            const lastSentToken = localStorage.getItem("lastSentFcmToken");
            if (fcmToken !== lastSentToken) {
                sendTokenToServer(fcmToken);
            }
        }
    }, [fcmToken, session, isAuthenticated, isRegistered]);

    // Send a heartbeat on mount and whenever the tab regains focus, so the
    // user's lastOnline timestamp stays up to date. The server throttles writes.
    useEffect(() => {
        if (!isAuthenticated || !isRegistered) return;
        sendHeartbeat();

        const onVisibility = () => {
            if (document.visibilityState === "visible") sendHeartbeat();
        };
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, [isAuthenticated, isRegistered]);

    return <>{children}</>;
}
