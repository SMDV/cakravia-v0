/**
 * Docker-specific Next.js configuration
 * This file is used during Docker build and matches the base configuration
 */

import type { NextConfig } from 'next'

const baseConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Optimize for production
  compress: true,

  // Image optimization for Docker
  images: {
    unoptimized: true,
  },

  // Disable telemetry
  telemetry: {
    disabled: true,
  },

  // PoweredByHeader
  poweredByHeader: false,

  // Security headers
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

// Export the configuration
export default baseConfig
