

/** @type {import('next').NextConfig} */


import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
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
