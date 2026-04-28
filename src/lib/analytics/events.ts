"use client";

import posthog from "posthog-js";
import { CONSENT_KEY } from "@/lib/consent/consent";

const SOURCE_COOKIE = "hosej_src";
const ENABLED = process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

function readSourceCookie(): string | undefined {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${SOURCE_COOKIE}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : undefined;
}

function consentGranted(): boolean {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(CONSENT_KEY) === "granted";
}

function safeCapture(event: string, props: Record<string, unknown>) {
    if (!ENABLED || typeof window === "undefined" || !consentGranted()) return;
    posthog.capture(event, { ...props, source: readSourceCookie() });
}

export function trackSignup(method: "device" | "google") {
    safeCapture("signup", { method });
}

export function trackGroupCreated(groupId: string) {
    safeCapture("group_created", { group_id: groupId });
}

export function trackGroupOpened(groupId: string) {
    safeCapture("group_opened", { group_id: groupId });
}
