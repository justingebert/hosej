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
    // webpack(config) {
    //   config.infrastructureLogging = { debug: /PackFileCache/ }
    //   return config;
    // }
});