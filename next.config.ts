/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
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
  
  // Enable SWC minification
  swcMinify: true,
  
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

module.exports = nextConfig