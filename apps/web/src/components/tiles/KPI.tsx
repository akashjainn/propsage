import React from 'react'
import { cn } from '@/lib/utils'

// Improved number formatting component
function StatNumber({ 
  value, 
  unit = '', 
  decimals = 0 
}: { 
  value: string | number
  unit?: string
  decimals?: number 
}) {
  // Handle string values (like "3.7%")
  if (typeof value === 'string') {
    return (
      <div className="text-2xl font-semibold text-foreground tabular-nums lining-nums tracking-tight leading-none">
        {value}
      </div>
    )
  }

  // Handle numeric values
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <div className="inline-flex items-baseline gap-1">
      <span className="text-2xl font-semibold text-foreground tabular-nums lining-nums tracking-tight leading-none">
        {formatted}
      </span>
      {unit && (
        <span className="text-lg text-secondary leading-none">{unit}</span>
      )}
    </div>
  )
}

interface KPITileProps {
  title: string
  value: string | number
  change?: {
    value: number
    period: string
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
  status?: 'healthy' | 'warning' | 'error'
  loading?: boolean
  className?: string
}

export function KPITile({
  title,
  value,
  change,
  icon,
  status = 'healthy',
  loading = false,
  className
}: KPITileProps) {
  return (
    <div className={cn(
      'glass rounded-lg p-6 transition-all duration-200 hover:shadow-lg',
      'border border-border hover:border-border-hover',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon && (
              <div className={cn(
                'rounded-lg p-2',
                status === 'healthy' && 'bg-positive/10 text-positive',
                status === 'warning' && 'bg-warning/10 text-warning',
                status === 'error' && 'bg-negative/10 text-negative'
              )}>
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-secondary leading-none">
              {title}
            </h3>
          </div>
          
          <div className="mt-4">
            {loading ? (
              <div className="h-8 w-24 animate-pulse bg-surface rounded" />
            ) : (
              <StatNumber value={value} />
            )}
            
            {change && !loading && (
              <div className="mt-2 flex items-center gap-1">
                <span className={cn(
                  'text-xs font-medium tabular-nums lining-nums',
                  change.direction === 'up' && 'text-positive',
                  change.direction === 'down' && 'text-negative',
                  change.direction === 'neutral' && 'text-secondary'
                )}>
                  {change.direction === 'up' && '↗'}
                  {change.direction === 'down' && '↘'}
                  {change.direction === 'neutral' && '→'}
                  {change.value > 0 && '+'}
                  {change.value}%
                </span>
                <span className="text-xs text-muted">
                  vs {change.period}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {status !== 'healthy' && (
          <div className={cn(
            'h-2 w-2 rounded-full',
            status === 'warning' && 'bg-warning',
            status === 'error' && 'bg-negative animate-pulse'
          )} />
        )}
      </div>
    </div>
  )
}

// Specialized KPI components for different metrics
export function EdgeCountTile({ edges, loading }: { edges?: number; loading?: boolean }) {
  return (
    <KPITile
      title="Active Edges"
      value={edges ?? 0}
      change={edges ? { value: 12, period: '1h', direction: 'up' } : undefined}
      status={edges && edges > 0 ? 'healthy' : 'warning'}
      loading={loading}
      icon={<span className="text-sm">⚡</span>}
    />
  )
}

export function AvgEdgeTile({ avgEdge, loading }: { avgEdge?: number; loading?: boolean }) {
  const percentValue = avgEdge ? (avgEdge * 100).toFixed(1) : '0.0'
  return (
    <KPITile
      title="Avg Edge"
      value={`${percentValue}%`}
      change={avgEdge ? { value: 0.8, period: '24h', direction: 'up' } : undefined}
      status={avgEdge && avgEdge > 0.03 ? 'healthy' : 'warning'}
      loading={loading}
      icon={<span className="text-sm">📊</span>}
    />
  )
}

export function BooksOnlineTile({ booksCount, loading }: { booksCount?: number; loading?: boolean }) {
  return (
    <KPITile
      title="Books Online"
      value={booksCount ?? 0}
      status={booksCount && booksCount >= 5 ? 'healthy' : booksCount && booksCount >= 3 ? 'warning' : 'error'}
      loading={loading}
      icon={<span className="text-sm">🏪</span>}
    />
  )
}

export function LiveMovementsTile({ movements, loading }: { movements?: number; loading?: boolean }) {
  return (
    <KPITile
      title="Live Movements (1h)"
      value={movements ?? 0}
      change={movements ? { value: 23, period: 'prev hour', direction: 'up' } : undefined}
      loading={loading}
      icon={<span className="text-sm">📈</span>}
    />
  )
}