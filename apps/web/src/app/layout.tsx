import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'PropSage - Sports Prop Pricing & Insight Copilot',
  description: 'Real-time sports prop pricing with grounded news analysis and video insights',
  keywords: 'sports betting, prop pricing, AI insights, real-time analysis',
  authors: [{ name: 'PropSage Team' }],
  creator: 'PropSage',
  publisher: 'PropSage'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
