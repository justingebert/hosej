"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global error:", error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex flex-col h-[100dvh] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <Link className="flex items-center text-lg" href="/groups">
                                <ArrowLeft />
                            </Link>
                        </div>
                        <h1 className="text-xl font-bold text-center flex-grow"></h1>
                        <div className="w-6"></div>
                    </div>

                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-md space-y-6 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <AlertCircle className="h-8 w-8" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-semibold tracking-tight">
                                    Critical error
                                </h1>
                                <p className="text-sm text-muted-foreground sm:text-base">
                                    The app hit a fatal error. Refresh and try again.
                                </p>
                            </div>
                            {process.env.NODE_ENV === "development" && (
                                <div className="rounded-2xl bg-muted p-4 text-left text-xs font-mono break-all">
                                    {error.message}
                                </div>
                            )}
                            <Button onClick={reset} className="w-full gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
