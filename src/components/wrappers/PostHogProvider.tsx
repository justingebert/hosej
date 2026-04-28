"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useConsent } from "./ConsentProvider";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const POSTHOG_ENABLED = process.env.NODE_ENV === "production" && !!POSTHOG_KEY;

let initialized = false;

function PostHogIdentify() {
    const { data: session, status } = useSession();
    const { status: consent } = useConsent();

    useEffect(() => {
        if (!POSTHOG_ENABLED || consent !== "granted" || !initialized) return;
        if (status === "authenticated" && session?.user?._id) {
            posthog.identify(session.user._id, {
                username: session.user.username,
                created_at: session.user.createdAt,
            });
        } else if (status === "unauthenticated") {
            posthog.reset();
        }
    }, [status, session?.user?._id, session?.user?.username, session?.user?.createdAt, consent]);

    return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
    const { status: consent } = useConsent();
    const active = POSTHOG_ENABLED && consent === "granted";

    useEffect(() => {
        if (!POSTHOG_ENABLED) return;
        if (consent === "granted" && !initialized) {
            posthog.init(POSTHOG_KEY!, {
                api_host: POSTHOG_HOST,
                defaults: "2025-05-24",
                capture_pageview: false,
                capture_pageleave: true,
                person_profiles: "identified_only",
            });
            initialized = true;
        } else if (consent === "denied" && initialized) {
            posthog.opt_out_capturing();
            posthog.reset();
        }
    }, [consent]);

    if (!active) return <>{children}</>;

    return (
        <PHProvider client={posthog}>
            <PostHogIdentify />
            {children}
        </PHProvider>
    );
}
