import { SearchInterface } from '@/components/SearchInterface'
import { Dashboard } from '@/components/Dashboard'
import { Header } from '@/components/Header'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative">
        <Header />
        
        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
              PropSage
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Enterprise-grade sports prop pricing with real-time AI insights, grounded news analysis, and video evidence
            </p>
          </div>

          <SearchInterface />
          <Dashboard />
        </main>
      </div>
    </div>
  )
}
