/** @type {import('next').NextConfig} */

import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: "src/sw.ts",
  swDest: "public/firebase-messaging-sw.js",
  swUrl: "/firebase-messaging-sw.js",
  disable: process.env.ENV === "development",
});

export default withSerwist({
    logging: {
        fetches:{
            fullUrl: true,
        }
    },
    images: {
        domains: ['hosej-rally-bucket.s3.eu-central-1.amazonaws.com'],
    },
});