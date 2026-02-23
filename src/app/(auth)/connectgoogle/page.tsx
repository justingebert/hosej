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
            if (deviceId && status === "authenticated") {
                setIsLinking(true);
                try {
                    const response = await fetch("/api/users/google", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ deviceId: deviceId }),
                    });

                    const result = await response.json();

                    if (response.ok) {
                        toast({ title: "Google account linked successfully." });
                        await signIn("google", { callbackUrl: `/groups` });
                    } else {
                        console.error("Failed to link Google account:", result.message);
                    }
                } catch (error) {
                    console.error("Error merging accounts:", error);
                }
            }
        };

        if (status === "authenticated") {
            mergeGoogleAccount();
        }
    }, [status, session, router]);

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
