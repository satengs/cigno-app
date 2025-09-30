/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable container deployment optimizations
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },

  // Configure for container deployment
  trailingSlash: false,
  output: 'standalone', // Required for Docker container deployment
  
  // Environment variables for client-side
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for security (important for Financial Services)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  // Image optimization settings for container deployment
  images: {
    unoptimized: true, // Disable Next.js image optimization for containers
    domains: [],
  },
};

export default nextConfig;
