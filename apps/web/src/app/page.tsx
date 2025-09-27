"use client"

import React, { useState, useEffect } from 'react'
import { MarketTape } from '@/components/MarketTape'
import { EdgeCountTile, AvgEdgeTile, BooksOnlineTile, LiveMovementsTile } from '@/components/tiles/KPI'
import { EdgeTable } from '@/components/tables/EdgeTable'
import { ProbCurve, generateSampleProbCurve } from '@/components/charts/ProbCurve'
import { cn } from '@/lib/utils'

// Sample data types matching our API
interface DashboardData {
  kpis: {
    activeEdges: number
    avgEdge: number
    booksOnline: number
    liveMovements: number
  }
  edges: Array<{
    id: string
    event: string
    playerId: string
    playerName: string
    market: string
    line: number
    bestPrice: number
    fml: number
    edge: number
    booksCount: number
    updatedAt: Date
    book: string
    side: 'over' | 'under'
  }>
  movements: Array<{
    id: string
    playerId: string
    playerName: string
    market: string
    oldLine: number
    newLine: number
    book: string
    timestamp: Date
    significant: boolean
  }>
}

export default function CommandCenter() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEdge, setSelectedEdge] = useState<any>(null)

  // Load dashboard data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // In production, these would be actual API calls
        // For now, using sample data that matches our backend structure
        
        const sampleData: DashboardData = {
          kpis: {
            activeEdges: 42,
            avgEdge: 0.037,
            booksOnline: 7,
            liveMovements: 156
          },
          edges: [
            {
              id: '1',
              event: 'KC @ BUF',
              playerId: 'mahomes',
              playerName: 'P. Mahomes',
              market: 'Pass Yds',
              line: 278.5,
              bestPrice: -105,
              fml: 274.2,
              edge: 0.048,
              booksCount: 6,
              updatedAt: new Date(Date.now() - 5 * 60 * 1000),
              book: 'DraftKings',
              side: 'under'
            },
            {
              id: '2', 
              event: 'MIA @ NYJ',
              playerId: 'hill',
              playerName: 'T. Hill',
              market: 'Rec Yds',
              line: 87.5,
              bestPrice: 110,
              fml: 91.3,
              edge: 0.034,
              booksCount: 5,
              updatedAt: new Date(Date.now() - 8 * 60 * 1000),
              book: 'FanDuel',
              side: 'over'
            },
            {
              id: '3',
              event: 'KC @ BUF', 
              playerId: 'kelce',
              playerName: 'T. Kelce',
              market: 'Receptions',
              line: 6.5,
              bestPrice: -115,
              fml: 7.1,
              edge: 0.052,
              booksCount: 7,
              updatedAt: new Date(Date.now() - 12 * 60 * 1000),
              book: 'BetMGM',
              side: 'over'
            }
          ],
          movements: [
            {
              id: '1',
              playerId: 'mahomes',
              playerName: 'P. Mahomes',
              market: 'Pass Yds',
              oldLine: 275.5,
              newLine: 278.5,
              book: 'DraftKings',
              timestamp: new Date(Date.now() - 3 * 60 * 1000),
              significant: true
            },
            {
              id: '2',
              playerId: 'allen',
              playerName: 'J. Allen',
              market: 'Pass TDs',
              oldLine: 1.5,
              newLine: 2.5,
              book: 'FanDuel',
              timestamp: new Date(Date.now() - 7 * 60 * 1000),
              significant: true
            }
          ]
        }
        
        setData(sampleData)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    
    // Set up real-time updates (every 30 seconds)
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleEdgeClick = (edge: any) => {
    setSelectedEdge(edge)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gradient">PropSage</h1>
              <p className="text-sm text-secondary">Command Center</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 bg-positive rounded-full animate-pulse" />
                <span className="text-secondary">Live</span>
              </div>
              
              <select className={cn(
                'px-3 py-2 text-sm rounded-lg border border-border',
                'bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-positive'
              )}>
                <option>NFL</option>
                <option>NBA</option>
                <option>MLB</option>
              </select>
              
              <button className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg',
                'bg-brand text-foreground hover:bg-brand/80',
                'transition-colors duration-200'
              )}>
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Market Tape */}
      <section className="border-b border-border bg-card">
        <MarketTape 
          movements={data?.movements} 
          className="h-16"
        />
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* KPI Dashboard */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Market Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <EdgeCountTile 
              edges={data?.kpis.activeEdges} 
              loading={loading} 
            />
            <AvgEdgeTile 
              avgEdge={data?.kpis.avgEdge} 
              loading={loading} 
            />
            <BooksOnlineTile 
              booksCount={data?.kpis.booksOnline} 
              loading={loading} 
            />
            <LiveMovementsTile 
              movements={data?.kpis.liveMovements} 
              loading={loading} 
            />
          </div>
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Edge Table - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <EdgeTable
              data={data?.edges || []}
              loading={loading}
              onRowClick={handleEdgeClick}
            />
          </div>

          {/* Probability Curve - 1 column */}
          <div>
            {selectedEdge ? (
              <ProbCurve
                data={generateSampleProbCurve(selectedEdge.line)}
                fmlLine={selectedEdge.fml}
                currentLine={selectedEdge.line}
                title={`${selectedEdge.playerName} ${selectedEdge.market}`}
                loading={loading}
              />
            ) : (
              <div className="glass rounded-lg p-8 border border-border text-center">
                <div className="text-muted mb-2">📊</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Probability Analysis
                </h3>
                <p className="text-sm text-secondary">
                  Click on an edge in the table to view the probability curve analysis
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Sections */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="glass rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button className={cn(
                'p-4 text-left rounded-lg border border-border',
                'hover:bg-surface-hover transition-colors duration-200'
              )}>
                <div className="text-sm font-medium text-foreground">Scan Markets</div>
                <div className="text-xs text-secondary">Find new edges</div>
              </button>
              <button className={cn(
                'p-4 text-left rounded-lg border border-border',
                'hover:bg-surface-hover transition-colors duration-200'
              )}>
                <div className="text-sm font-medium text-foreground">Player Search</div>
                <div className="text-xs text-secondary">Research specific players</div>
              </button>
              <button className={cn(
                'p-4 text-left rounded-lg border border-border',
                'hover:bg-surface-hover transition-colors duration-200'
              )}>
                <div className="text-sm font-medium text-foreground">Video Intel</div>
                <div className="text-xs text-secondary">Check latest insights</div>
              </button>
              <button className={cn(
                'p-4 text-left rounded-lg border border-border',
                'hover:bg-surface-hover transition-colors duration-200'
              )}>
                <div className="text-sm font-medium text-foreground">Book Status</div>
                <div className="text-xs text-secondary">Monitor connectivity</div>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="glass rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">API Response Time</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-positive rounded-full" />
                  <span className="text-sm font-mono">127ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Data Freshness</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-positive rounded-full" />
                  <span className="text-sm font-mono">2m ago</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Book Connections</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-positive rounded-full" />
                  <span className="text-sm font-mono">7/7 online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">FML Engine</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-positive rounded-full" />
                  <span className="text-sm font-mono">Running</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}