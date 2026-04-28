"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useConsent } from "./ConsentProvider";

const ENABLED = process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

function Pageview() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { status: consent } = useConsent();

    useEffect(() => {
        if (!ENABLED || !pathname || consent !== "granted") return;
        const qs = searchParams?.toString();
        const url = qs ? `${pathname}?${qs}` : pathname;
        posthog.capture("$pageview", { $current_url: url });
    }, [pathname, searchParams, consent]);

    return null;
}

export function PostHogPageview() {
    return (
        <Suspense fallback={null}>
            <Pageview />
        </Suspense>
    );
}
