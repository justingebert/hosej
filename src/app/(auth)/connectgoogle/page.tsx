"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SpinningLoader from "@/components/ui/custom/SpinningLoader";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { signIn } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

export default function GoogleCallbackPage() {
    const { session, status, user } = useAuthRedirect();
    const router = useRouter();
    const { toast } = useToast();
    const [isLinking, setIsLinking] = useState(false);

    useEffect(() => {
        const mergeGoogleAccount = async () => {
            const deviceId = localStorage.getItem("deviceId");
            if (!deviceId) {
                // No device user to merge — this is a fresh Google signup
                router.replace("/settings");
                return;
            }

            setIsLinking(true);
            try {
                const response = await fetch("/api/users/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ deviceId }),
                });

                const result = await response.json();

                if (response.ok) {
                    localStorage.removeItem("deviceId");
                    toast({ title: "Google account linked successfully." });
                    await signIn("google", { callbackUrl: `/groups` });
                } else {
                    console.error("Failed to link Google account:", result.message);
                    router.replace("/settings");
                }
            } catch (error) {
                console.error("Error merging accounts:", error);
                router.replace("/settings");
            }
        };

        if (status === "authenticated") {
            mergeGoogleAccount();
        }
    }, [status, session, router, toast]);

    if (status === "loading") {
        return <SpinningLoader loading={true} />;
    }

    if (isLinking) {
        return (
            <div className="flex flex-col items-center justify-center gap-4">
                <SpinningLoader loading={true} />
                <p className="text-muted-foreground">Linking Google account...</p>
            </div>
        );
    }

    return <SpinningLoader loading={true} />;
}
