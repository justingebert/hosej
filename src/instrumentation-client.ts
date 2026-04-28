// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Replay + PII gated on cookie consent (read synchronously at boot).
// Without consent we still report errors under legitimate interest, but with
// no DOM replay and no PII (no IP, no user identifiers).
const consentGranted =
    typeof window !== "undefined" && window.localStorage?.getItem("hosej_consent") === "granted";

Sentry.init({
    enabled: process.env.ENV !== "dev",

    dsn: "https://d78943b8a6fd6804ae653bda2318fe79@o4511224419057664.ingest.de.sentry.io/4511224421023824",

    integrations: consentGranted ? [Sentry.replayIntegration()] : [],

    tracesSampleRate: 1,
    enableLogs: true,

    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: consentGranted ? 0.25 : 0,

    sendDefaultPii: consentGranted,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
