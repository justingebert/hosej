import { withSentryConfig } from "@sentry/nextjs";
/** @type {import('next').NextConfig} */

import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
    swSrc: "src/sw.ts",
    swDest: "public/firebase-messaging-sw.js",
    swUrl: "/firebase-messaging-sw.js",
    disable: process.env.ENV === "dev",
});

const dev = process.env.ENV === "dev";

const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ...(dev
        ? []
        : [
              {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
              },
          ]),
];

export default withSentryConfig(
    withSerwist({
        experimental: {
            viewTransition: true,
            staleTimes: {
                dynamic: 30,
            },
        },
        allowedDevOrigins: [],
        // Empty turbopack config silences the "webpack config found" error
        // for `next dev` (Turbopack). Serwist is disabled in dev anyway.
        // Production builds use --webpack where Serwist needs webpack.
        turbopack: {},
        logging: {
            fetches: {
                fullUrl: !dev,
            },
        },
        images: {
            remotePatterns: [
                {
                    protocol: "https",
                    hostname: "hosej-rally-bucket.s3.eu-central-1.amazonaws.com",
                },
                {
                    protocol: "https",
                    hostname: "i.scdn.co",
                },
            ],
            unoptimized: false,
        },
        async headers() {
            return [
                {
                    source: "/(.*)",
                    headers: securityHeaders,
                },
            ];
        },
    }),
    {
        // For all available options, see:
        // https://www.npmjs.com/package/@sentry/webpack-plugin#options

        org: "justingebert-ez",

        project: "hosej",

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
        // This can increase your server load as well as your hosting bill.
        // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
        // side errors will fail.
        // tunnelRoute: "/monitoring",

        webpack: {
            // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
            // See the following for more information:
            // https://docs.sentry.io/product/crons/
            // https://vercel.com/docs/cron-jobs
            automaticVercelMonitors: true,

            // Tree-shaking options for reducing bundle size
            treeshake: {
                // Automatically tree-shake Sentry logger statements to reduce bundle size
                removeDebugLogging: true,
            },
        },
    }
);
