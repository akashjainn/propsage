import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

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
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0D1321',
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
