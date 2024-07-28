

/** @type {import('next').NextConfig} */


import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  reloadOnOnline: true,
  //swcMinify: true,
  //disable: process.env.NODE_ENV === "development",
  //disable: true
  //ustomWorkerDest: "public", // defaults to `dest`
  //customWorkerPrefix: "firebase-messaging-sw",
  sw: 'firebase-messaging-sw.js' 
});

const nextConfig = {
    logging: {
        fetches:{
            fullUrl: true,
        }
    },
    images: {
        domains: ['hosej-rally-bucket.s3.eu-central-1.amazonaws.com'],
    },
};

export default withPWA(nextConfig);
