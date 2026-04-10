"use client";

import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { HoseJLoader } from "@/components/ui/custom/HoseJLoader";

function SetupNameContent() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams?.get("callbackUrl") || "/groups";
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Pre-fill with current username once session loads
    if (session?.user?.username && !initialized) {
        setName(session.user.username);
        setInitialized(true);
    }

    if (status === "loading") {
        return <HoseJLoader />;
    }

    // If user doesn't need name setup, redirect away
    if (session && !session.user.needsNameSetup) {
        router.replace(callbackUrl);
        return <HoseJLoader />;
    }

    const handleSubmit = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            toast({ title: "Please enter a name!", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: trimmed }),
            });

            if (!res.ok) {
                const data = await res.json();
                toast({ title: data.message || "Failed to update name", variant: "destructive" });
                return;
            }

            // Refresh session — clears needsNameSetup flag since DB doesn't have it
            await update();
            router.push(callbackUrl);
        } catch {
            toast({ title: "Something went wrong", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-sm space-y-6 text-center">
                <h1 className="text-2xl font-bold">Set Your Name</h1>

                <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="text-center"
                    maxLength={30}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmit();
                    }}
                />

                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                    {submitting ? "Saving..." : "Confirm"}
                </Button>
            </div>
        </div>
    );
}

export default function SetupNamePage() {
    return (
        <Suspense fallback={<HoseJLoader />}>
            <SetupNameContent />
        </Suspense>
    );
}
