const nextConfig = {
  experimental: {
    useCache: true,
    // how many times Next.js will retry failed page generation attempts
    // before failing the build
    staticGenerationRetryCount: 1,
    // how many pages will be processed per worker
    staticGenerationMaxConcurrency: 8,
    // the minimum number of pages before spinning up a new export worker
    staticGenerationMinPagesPerWorker: 25
  },
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
      },
      {
        protocol: 'https',
        hostname: 'gstatic.com',
      }
    ],
  },

};

module.exports = nextConfig
