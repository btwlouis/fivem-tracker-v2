const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
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

module.exports = nextConfig
