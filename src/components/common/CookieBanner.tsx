"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/components/wrappers/ConsentProvider";

export default function CookieBanner() {
    const { status, grant, deny } = useConsent();

    if (status !== "unknown") return null;

    return (
        <div
            role="dialog"
            aria-modal="false"
            aria-label="Cookie preferences"
            className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 pointer-events-none"
        >
            <div className="mx-auto max-w-md rounded-2xl border bg-background shadow-lg p-4 space-y-3 pointer-events-auto">
                <div className="space-y-1">
                    <h2 className="font-semibold text-base leading-none tracking-tight">
                        Cookies & analytics
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        We use product analytics and session replay to improve hosej. Login cookies
                        and basic error monitoring stay on either way.{" "}
                        <Link href="/privacy" className="underline text-primary">
                            Learn more
                        </Link>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={deny}>
                        Reject
                    </Button>
                    <Button className="flex-1" onClick={grant}>
                        Accept
                    </Button>
                </div>
            </div>
        </div>
    );
}
