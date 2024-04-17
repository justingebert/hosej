

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
};

export default withPWA(nextConfig);
