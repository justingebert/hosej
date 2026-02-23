/** @type {import('next').NextConfig} */

import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/firebase-messaging-sw.js",
  swUrl: "/firebase-messaging-sw.js",
  disable: process.env.ENV === "dev",
});

const dev = process.env.ENV === "dev"

export default withSerwist({
    // Empty turbopack config silences the "webpack config found" error
    // for `next dev` (Turbopack). Serwist is disabled in dev anyway.
    // Production builds use --webpack where Serwist needs webpack.
    turbopack: {},
    logging: {
        fetches:{
            fullUrl: !dev,
        }
    },
    images: {
        remotePatterns: [
            {
              protocol: "https",
              hostname: "hosej-rally-bucket.s3.eu-central-1.amazonaws.com",
            },
          ],
          unoptimized: true,
    },
});