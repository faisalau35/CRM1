/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve Node.js modules on the client to prevent errors
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        child_process: false,
        util: false,
        async_hooks: false,
        events: false,
        stream: false,
        buffer: false,
        http: false,
        url: false,
        zlib: false
      }
    }
    return config
  },
  // Enable image optimization
  images: {
    domains: ['localhost'],
    // Add any other domains you need to serve images from
  },
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  // Configure redirects if needed
  async redirects() {
    return []
  },
  // Configure rewrites if needed
  async rewrites() {
    return []
  },
  // Enable strict mode for React
  reactStrictMode: true,
  // Configure output directory
  distDir: '.next',
  // Optimize for Vercel deployment
  output: 'standalone',
}

module.exports = nextConfig 