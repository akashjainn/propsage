import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PropSage',
    short_name: 'PropSage',
    description: 'Enterprise sports betting analytics with AI-powered fair value and evidence.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0f1a',
    theme_color: '#0b0f1a',
    icons: [
      // Favicons for browser tabs
      { src: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { src: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { src: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },

      // PWA icons
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },

      // Apple touch icon
      { src: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
