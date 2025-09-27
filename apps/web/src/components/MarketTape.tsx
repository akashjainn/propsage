import React, { useState, useEffect, useRef } from 'react'
import { cn, formatEdge, formatRelativeTime } from '@/lib/utils'

interface LineMovement {
  id: string
  playerId: string
  playerName: string
  market: string
  oldLine: number
  newLine: number
  book: string
  timestamp: Date
  significant: boolean // Line move > 1.0
}

interface MarketTapeProps {
  movements?: LineMovement[]
  className?: string
  speed?: number // pixels per second
  pauseOnHover?: boolean
}

export function MarketTape({
  movements = [],
  className,
  speed = 50,
  pauseOnHover = true
}: MarketTapeProps) {
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Sample data if none provided
  const sampleMovements: LineMovement[] = [
    {
      id: '1',
      playerId: 'mahomes',
      playerName: 'P. Mahomes',
      market: 'Pass Yds',
      oldLine: 278.5,
      newLine: 281.5,
      book: 'DraftKings',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      significant: true
    },
    {
      id: '2', 
      playerId: 'hill',
      playerName: 'T. Hill',
      market: 'Rec Yds',
      oldLine: 87.5,
      newLine: 85.5,
      book: 'FanDuel',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      significant: false
    },
    {
      id: '3',
      playerId: 'kelce',
      playerName: 'T. Kelce',
      market: 'Receptions',
      oldLine: 6.5,
      newLine: 7.5,
      book: 'BetMGM',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      significant: true
    }
  ]
  
  const displayMovements = movements.length > 0 ? movements : sampleMovements
  
  const MovementCard = ({ movement }: { movement: LineMovement }) => {
    const lineDiff = movement.newLine - movement.oldLine
    const isUp = lineDiff > 0
    
    return (
      <div
        className={cn(
          'flex-shrink-0 mx-3 px-4 py-2 rounded-lg border transition-all duration-200',
          'bg-surface/80 backdrop-blur-sm border-border hover:border-border-hover',
          'cursor-pointer hover:shadow-md hover:scale-105',
          movement.significant && 'ring-1 ring-positive/20'
        )}
        onClick={() => {
          // Future: Navigate to player/market detail
          console.log('Navigate to:', movement.playerId, movement.market)
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Significance indicator */}
          {movement.significant && (
            <div className="h-2 w-2 bg-positive rounded-full animate-pulse" />
          )}
          
          {/* Player info */}
          <div className="min-w-0">
            <div className="font-medium text-sm text-foreground truncate">
              {movement.playerName}
            </div>
            <div className="text-xs text-secondary">
              {movement.market}
            </div>
          </div>
          
          {/* Line movement */}
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-muted">{movement.oldLine}</span>
            <span className={cn(
              'font-semibold',
              isUp ? 'text-positive' : 'text-negative'
            )}>
              {isUp ? '↗' : '↘'} {movement.newLine}
            </span>
          </div>
          
          {/* Book & timestamp */}
          <div className="text-right min-w-0">
            <div className="text-xs font-medium text-foreground">
              {movement.book}
            </div>
            <div className="text-xs text-muted">
              {formatRelativeTime(movement.timestamp)}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPaused(true)
  }
  
  const handleMouseLeave = () => {
    if (pauseOnHover) setIsPaused(false)
  }
  
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />
      
      <div
        ref={containerRef}
        className="flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={cn(
          'flex items-center animate-marquee',
          isPaused && 'animation-paused'
        )}>
          {/* Duplicate the movements for seamless loop */}
          {[...displayMovements, ...displayMovements].map((movement, index) => (
            <MovementCard
              key={`${movement.id}-${index}`}
              movement={movement}
            />
          ))}
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div className={cn(
          'flex items-center gap-2 px-2 py-1 rounded text-xs',
          'bg-surface/90 backdrop-blur-sm border border-border'
        )}>
          <div className={cn(
            'h-1 w-1 rounded-full',
            isPaused ? 'bg-warning' : 'bg-positive animate-pulse'
          )} />
          <span className="text-secondary font-medium">
            {isPaused ? 'PAUSED' : 'LIVE'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Add to global CSS or update existing animation
const style = `
@keyframes marquee {
  0% { transform: translateX(0%) }
  100% { transform: translateX(-100%) }
}

.animate-marquee {
  animation: marquee 25s linear infinite;
}

.animation-paused {
  animation-play-state: paused;
}
`