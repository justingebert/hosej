"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
                <div className="flex flex-col h-[100dvh] p-4">
                    {/* Simple Header with Back Link */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <Link className="flex items-center text-lg" href="/groups">
                                <ArrowLeft />
                            </Link>
                        </div>
                        <h1 className="text-xl font-bold text-center flex-grow"></h1>
                        <div className="w-6"></div>
                    </div>

                    <div className="flex items-center justify-center flex-1">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-destructive mb-2">
                                    <AlertCircle className="h-6 w-6" />
                                    <CardTitle>Critical Error</CardTitle>
                                </div>
                                <CardDescription>
                                    A critical error occurred. Please try refreshing the page.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                {process.env.NODE_ENV === "development" && (
                                    <div className="rounded-md bg-muted p-3 text-xs font-mono break-all">
                                        {error.message}
                                    </div>
                                )}
                                <Button onClick={reset} className="w-full gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </body>
        </html>
    );
}
