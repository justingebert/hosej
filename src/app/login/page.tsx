"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { HoseJLoader } from "@/components/ui/custom/HoseJLoader";
import PWAInstallButton from "@/components/common/PWAInstallButton";
import ResponsiveConfirm from "@/components/common/ResponsiveConfirm";

const SUPPORT_EMAIL = "pregame_acid_9o@icloud.com";

function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    let callbackUrl = searchParams?.get("callbackUrl") || "/groups";
    const { toast } = useToast();
    const [userName, setUserName] = useState("");
    const [loading, setLoading] = useState(true);

    const handleSignIn = useCallback(
        async (provider: string, options = {}) => {
            try {
                const result = await signIn(provider, { ...options, redirect: false });
                if (result?.ok) {
                    router.push(callbackUrl);
                } else {
                    console.error(`${provider} sign-in failed:`, result?.error);
                }
            } catch (error) {
                console.error(`Error during ${provider} sign-in:`, error);
                // Don't show error toast for network failures with a stored deviceId —
                // the user didn't initiate this, it was auto-sign-in on app open.
                if (navigator.onLine) {
                    toast({ title: "Failed to sign in!", variant: "destructive" });
                }
            } finally {
                // Only reveal the login form if we're online.
                // If offline/flaky, keep the loader — the user still has credentials,
                // they just can't reach the server right now.
                if (navigator.onLine) setLoading(false);
            }
        },
        [callbackUrl, router]
    );

    const handleStartWithoutAccount = async () => {
        if (!userName) {
            toast({ title: "Please Enter your name!", variant: "destructive" });
            return;
        }

        let deviceId = localStorage.getItem("deviceId");
        if (!deviceId) {
            deviceId = uuidv4();
            await createUserByDeviceId(deviceId, userName);
        }
        await handleSignIn("credentials", { deviceId });
    };

    const createUserByDeviceId = async (deviceId: string, userName: string) => {
        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId, userName }),
            });

            if (response.ok) {
                localStorage.setItem("deviceId", deviceId);
            } else {
                console.error("Failed to create user:", await response.text());
            }
        } catch (error) {
            console.error("Error creating user:", error);
        }
    };

    const handleGoogleSignIn = async () => {
        if (userName) {
            localStorage.setItem("userName", userName);
        }

        await handleSignIn("google", { callbackUrl });
    };

    const handleRecoverWithDeviceId = useCallback(
        async (deviceId: string) => {
            const trimmed = deviceId.trim();
            if (!trimmed) return;
            localStorage.setItem("deviceId", trimmed);
            await handleSignIn("credentials", { deviceId: trimmed });
        },
        [handleSignIn]
    );

    useEffect(() => {
        if (!navigator.onLine) {
            router.replace("/offline");
            return;
        }

        if (status === "loading") return;

        if (session) {
            const isExplicitCallback = searchParams?.get("callbackUrl");
            if (!isExplicitCallback) {
                const starredGroupId = localStorage.getItem("starredGroupId");
                if (starredGroupId) {
                    callbackUrl = `/groups/${starredGroupId}/dashboard`;
                }
            }
            router.push(callbackUrl);
        } else {
            const deviceId = localStorage.getItem("deviceId");
            if (deviceId) {
                handleSignIn("credentials", { deviceId });
            } else {
                setLoading(false);
            }
        }
    }, [session, status, handleSignIn, router, callbackUrl]);

    if (loading || status === "loading") {
        return <HoseJLoader />;
    }

    return (
        <div className="flex flex-col justify-between min-h-screen">
            <Header />

            <main className="flex flex-col items-center justify-center flex-grow space-y-6">
                <Input
                    type="text"
                    placeholder="What do your friends call you?"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && userName) handleStartWithoutAccount();
                    }}
                    className="w-full max-w-sm text-center"
                />

                <SignInButtons
                    onStartWithoutAccount={handleStartWithoutAccount}
                    onGoogleSignIn={handleGoogleSignIn}
                />

                <LostAccountPrompt onRecover={handleRecoverWithDeviceId} />
            </main>
            <Footer />
        </div>
    );
}

export default function HomeWithSuspense() {
    return (
        <Suspense fallback={<HoseJLoader />}>
            <LoginPage />
        </Suspense>
    );
}

function SignInButtons({
    onStartWithoutAccount,
    onGoogleSignIn,
}: {
    onStartWithoutAccount: () => void;
    onGoogleSignIn: () => void;
}) {
    return (
        <div className="space-y-4 w-full max-w-sm">
            <Button onClick={onStartWithoutAccount} variant="secondary" className="w-full">
                Start without Account
            </Button>
            <Button onClick={onGoogleSignIn} className="w-full">
                <FcGoogle className="mr-2" size={24} />
                Continue with Google
            </Button>
            <PWAInstallButton variant="ghost" className="w-full" />
        </div>
    );
}

const RECOVERY_WINDOW_MS = 60 * 1000;
const RECOVERY_MAX_ATTEMPTS = 5;

function LostAccountPrompt({ onRecover }: { onRecover: (deviceId: string) => Promise<void> }) {
    const [deviceId, setDeviceId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const attemptsRef = useRef<number[]>([]);
    const { toast } = useToast();

    const canAttempt = () => {
        const now = Date.now();
        attemptsRef.current = attemptsRef.current.filter((t) => now - t < RECOVERY_WINDOW_MS);
        return attemptsRef.current.length < RECOVERY_MAX_ATTEMPTS;
    };

    const handleConfirm = async () => {
        const trimmed = deviceId.trim();
        if (!trimmed) {
            toast({ title: "Please enter your device ID", variant: "destructive" });
            return;
        }
        if (!canAttempt()) {
            toast({
                title: "Too many attempts",
                description: "Please wait a minute before trying again.",
                variant: "destructive",
            });
            return;
        }
        attemptsRef.current.push(Date.now());
        setSubmitting(true);
        try {
            await onRecover(trimmed);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ResponsiveConfirm
            trigger={
                <button
                    type="button"
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                >
                    Lost your account?
                </button>
            }
            title="Lost your account?"
            description={
                <>
                    Device-based accounts live on this device. Paste your device ID below to
                    restore, or reach out to{" "}
                    <a
                        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("HoseJ — Lost account")}`}
                        className="underline"
                    >
                        {SUPPORT_EMAIL}
                    </a>
                    .
                </>
            }
            confirmLabel={submitting ? "Restoring…" : "Restore"}
            cancelLabel="Close"
            confirmVariant="default"
            confirmDisabled={submitting || !deviceId.trim()}
            onConfirm={handleConfirm}
            onOpenChange={(open) => {
                if (!open) setDeviceId("");
            }}
        >
            <div className="px-4 sm:px-0">
                <Input
                    type="text"
                    placeholder="Device ID"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="text-center"
                />
            </div>
        </ResponsiveConfirm>
    );
}

function Footer() {
    return (
        <footer className="text-center p-4">
            <p className="text-sm text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline">
                    Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">
                    Privacy Policy
                </Link>
                .
            </p>
        </footer>
    );
}

function Header() {
    return (
        <header className="text-center p-6">
            <Link href={"/"}>
                <h1 className="text-4xl font-bold">HoseJ</h1>
            </Link>
        </header>
    );
}
