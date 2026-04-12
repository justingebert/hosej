"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "Access denied. You may not have permission to sign in.",
    Verification: "The verification link has expired or has already been used.",
    OAuthSignin: "Could not start the sign-in process. Please try again.",
    OAuthCallback: "Something went wrong during sign-in. Please try again.",
    OAuthCreateAccount: "Could not create your account. Please try again.",
    OAuthAccountNotLinked:
        "This email is already linked to another account. Try signing in with your original method.",
    SessionRequired: "Please sign in to access this page.",
    Callback: "Something went wrong during sign-in. Please try again.",
    Default: "An unexpected error occurred. Please try again.",
};

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const errorCode = searchParams?.get("error") || "Default";
    const message = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.Default;

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertCircle className="h-6 w-6" />
                        <CardTitle>Sign-in Error</CardTitle>
                    </div>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {process.env.NODE_ENV === "development" && (
                        <div className="rounded-md bg-muted p-3 text-xs font-mono">
                            Error code: {errorCode}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button asChild variant="outline" className="flex-1">
                            <Link href="/login">
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Try Again
                            </Link>
                        </Button>
                        <Button asChild className="flex-1">
                            <Link href="/login">
                                <Home className="h-4 w-4 mr-2" />
                                Go Home
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense>
            <AuthErrorContent />
        </Suspense>
    );
}
