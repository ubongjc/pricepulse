import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Enable experimental features as needed
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Sentry will be configured via withSentryConfig wrapper
};

export default nextConfig;
