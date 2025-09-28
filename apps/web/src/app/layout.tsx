import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import ToastBus from '@/components/ToastBus'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PropSage - Enterprise Sports Betting Intelligence',
  description: 'Professional Fair Market Line engine with AI-powered edge detection and video intelligence',
  keywords: ['sports betting', 'fair market line', 'edge detection', 'props', 'analytics'],
  authors: [{ name: 'PropSage Team' }],
  creator: 'PropSage Team',
  publisher: 'PropSage',
  applicationName: 'PropSage',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icon.png',
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/icon.png',
      },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://propsage.app',
    title: 'PropSage - Enterprise Sports Betting Intelligence',
    description: 'Professional Fair Market Line engine with AI-powered edge detection and video intelligence',
    siteName: 'PropSage',
    images: [
      {
        url: '/icon.png',
        width: 1200,
        height: 630,
        alt: 'PropSage - Enterprise Sports Betting Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PropSage - Enterprise Sports Betting Intelligence',
    description: 'Professional Fair Market Line engine with AI-powered edge detection and video intelligence',
    creator: '@propsage',
    images: ['/icon.png'],
  },
  category: 'sports',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0D1321' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1321' },
  ],
  colorScheme: 'dark light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="theme-dark">
      <body className={cn(
        inter.variable,
        'font-sans antialiased min-h-screen body-bg text-[var(--fg)]',
        'selection:bg-[var(--mint)]/20 selection:text-[var(--fg)]'
      )}>
        <div className="relative flex min-h-screen flex-col">
          {/* Background Pattern */}
          <div className="bg-grid" />
          
          {/* Main Content */}
          <div className="relative flex-1">
            {children}
          </div>
          <ToastBus />
          
          {/* Footer */}
          <footer className="border-t border-white/10 bg-[var(--card)]/50 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between text-sm text-[var(--fg-dim)]">
                <div className="flex items-center gap-4">
                  <span>© 2025 PropSage</span>
                  <span>•</span>
                  <span>Enterprise Sports Intelligence</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Built for HackGT 12</span>
                  <div className="h-2 w-2 bg-[var(--mint)] rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
