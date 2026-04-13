"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Application error:", error);
    }, [error]);

    const handleGoHome = () => {
        router.push("/groups");
    };

    return (
        <div className="flex flex-col h-[100dvh]">
            <Header leftComponent={<BackLink href={`/groups`} />} />
            <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Something went wrong
                        </h1>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            An unexpected error occurred. Try again or head back to your groups.
                        </p>
                    </div>
                    {process.env.NODE_ENV === "development" && (
                        <div className="rounded-2xl bg-muted p-4 text-left text-xs font-mono break-all">
                            {error.message}
                        </div>
                    )}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <Button onClick={reset} variant="outline" className="w-full sm:flex-1">
                            Try Again
                        </Button>
                        <Button onClick={handleGoHome} className="w-full gap-2 sm:flex-1">
                            <Home className="h-4 w-4" />
                            Go to Groups
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
