import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'servers-frontend.fivem.net',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      }
    ],
  },

};

export default nextConfig;
