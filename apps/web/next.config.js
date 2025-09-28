/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['ws']
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
