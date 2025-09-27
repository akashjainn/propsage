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
  viewport: 'width=device-width, initial-scale=1',
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
        'font-sans antialiased min-h-screen bg-background text-foreground',
        'selection:bg-positive/20 selection:text-foreground'
      )}>
        <div className="relative flex min-h-screen flex-col">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5" />
          
          {/* Main Content */}
          <div className="relative flex-1">
            {children}
          </div>
          
          {/* Footer */}
          <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between text-sm text-secondary">
                <div className="flex items-center gap-4">
                  <span>© 2025 PropSage</span>
                  <span>•</span>
                  <span>Enterprise Sports Intelligence</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Built for HackGT 12</span>
                  <div className="h-2 w-2 bg-positive rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}