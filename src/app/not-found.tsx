"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, SearchX } from "lucide-react";
import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";

export default function NotFound() {
    const router = useRouter();

    // Auto-redirect after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            router.push("/groups");
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    const handleGoHome = () => {
        router.push("/groups");
    };

    return (
        <div className="flex flex-col h-[100dvh]">
            <Header leftComponent={<BackLink href={`/groups`} />} />
            <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-foreground">
                        <SearchX className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            The page you&apos;re looking for doesn&apos;t exist or has been moved.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Redirecting you back to your groups in a few seconds.
                        </p>
                    </div>
                    <Button onClick={handleGoHome} className="w-full gap-2">
                        <Home className="h-4 w-4" />
                        Go to Groups
                    </Button>
                </div>
            </div>
        </div>
    );
}
