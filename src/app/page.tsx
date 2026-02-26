"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { HoseJLoader } from "@/components/ui/custom/HoseJLoader";

function StartPage() {
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
                toast({ title: "Failed to sign in!", variant: "destructive" });
            } finally {
                setLoading(false);
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

    useEffect(() => {
        if (status === "loading") return;

        if (session) {
            const starredGroupId = localStorage.getItem("starredGroupId");
            if (starredGroupId) {
                callbackUrl = `/groups/${starredGroupId}/dashboard`;
            }
            router.push(callbackUrl);
        } else {
            const deviceId = localStorage.getItem("deviceId");
            if (deviceId) handleSignIn("credentials", { deviceId });
            else setLoading(false);
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
                    className="w-full max-w-sm text-center"
                />

                <SignInButtons
                    onStartWithoutAccount={handleStartWithoutAccount}
                    onGoogleSignIn={handleGoogleSignIn}
                />
            </main>
            <Footer />
        </div>
    );
}

export default function HomeWithSuspense() {
    return (
        <Suspense fallback={<HoseJLoader />}>
            <StartPage />
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
        </div>
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
            <Link href={"/deviceauth"}>
                <h1 className="text-4xl font-bold">HoseJ</h1>
            </Link>
        </header>
    );
}
