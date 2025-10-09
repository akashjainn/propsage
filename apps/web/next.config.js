/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['ws']
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ]
      }
    ]
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_API_WS_URL: process.env.NEXT_PUBLIC_API_WS_URL || 'ws://localhost:4000',
    NEXT_PUBLIC_FEATURE_NEW_PLAYER: process.env.NEXT_PUBLIC_FEATURE_NEW_PLAYER || 'true',
    NEXT_PUBLIC_FEATURE_TL: process.env.NEXT_PUBLIC_FEATURE_TL || 'false',
    NEXT_PUBLIC_FEATURE_TOP_EDGES: process.env.NEXT_PUBLIC_FEATURE_TOP_EDGES || 'true'
  }
}
module.exports = nextConfig
