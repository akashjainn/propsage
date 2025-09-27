import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts'
import { cn, formatPercent } from '@/lib/utils'

interface ProbCurvePoint {
  line: number
  marketProb: number
  modelProb: number
  blendedProb: number
  ciLower?: number
  ciUpper?: number
}

interface ProbCurveProps {
  data: ProbCurvePoint[]
  fmlLine?: number
  currentLine?: number
  title?: string
  loading?: boolean
  className?: string
}

export function ProbCurve({
  data,
  fmlLine,
  currentLine,
  title = 'Market vs Model Probability',
  loading = false,
  className
}: ProbCurveProps) {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-border shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">
            Line: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-secondary">{entry.name}:</span>
              <span className="font-mono text-foreground">
                {formatPercent(entry.value / 100)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="h-6 w-48 bg-surface animate-pulse rounded" />
        <div className="h-64 bg-surface animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-positive" />
            <span className="text-secondary">Market</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand" />
            <span className="text-secondary">Model</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-secondary">Blended</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-lg p-4 border border-border">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.5}
            />
            <XAxis
              dataKey="line"
              stroke="var(--text-secondary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            
            {/* Confidence interval area */}
            {data.some(d => d.ciLower && d.ciUpper) && (
              <Area
                dataKey="ciUpper"
                stroke="none"
                fill="var(--brand)"
                fillOpacity={0.1}
                connectNulls={false}
              />
            )}
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Market probability line */}
            <Line
              type="monotone"
              dataKey="marketProb"
              stroke="var(--accent-pos)"
              strokeWidth={2}
              dot={false}
              name="Market"
              connectNulls={false}
            />
            
            {/* Model probability line */}
            <Line
              type="monotone"
              dataKey="modelProb"
              stroke="var(--brand)"
              strokeWidth={2}
              dot={false}
              name="Model"
              connectNulls={false}
            />
            
            {/* Blended probability line */}
            <Line
              type="monotone"
              dataKey="blendedProb"
              stroke="var(--warning)"
              strokeWidth={3}
              dot={false}
              name="Blended"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Reference lines and annotations */}
        {(fmlLine || currentLine) && (
          <div className="mt-4 flex items-center gap-6 text-xs">
            {fmlLine && (
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-warning rounded" />
                <span className="text-secondary">FML:</span>
                <span className="font-mono text-foreground">{fmlLine.toFixed(1)}</span>
              </div>
            )}
            {currentLine && (
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-positive rounded" />
                <span className="text-secondary">Current:</span>
                <span className="font-mono text-foreground">{currentLine.toFixed(1)}</span>
              </div>
            )}
            {fmlLine && currentLine && (
              <div className="flex items-center gap-2">
                <span className="text-secondary">Diff:</span>
                <span className={cn(
                  'font-mono font-semibold',
                  Math.abs(fmlLine - currentLine) > 1 ? 'text-warning' : 'text-secondary'
                )}>
                  {(fmlLine - currentLine).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Methodology note */}
      <div className="text-xs text-muted">
        <span className="font-medium">Note:</span> Market curve derived from book consensus with devigging. 
        Model curve uses player distribution with injury/usage adjustments. 
        Blended combines both with adaptive weighting.
      </div>
    </div>
  )
}

// Sample data generator for development/demo
export function generateSampleProbCurve(
  centerLine: number = 275.5,
  spread: number = 20
): ProbCurvePoint[] {
  const points: ProbCurvePoint[] = []
  
  for (let i = -spread; i <= spread; i += 2) {
    const line = centerLine + i
    const x = i / spread // Normalized position
    
    // Market probability (sigmoid-like)
    const marketProb = 50 + 45 * Math.tanh(x * 2)
    
    // Model probability (slightly different curve)
    const modelProb = 50 + 40 * Math.tanh(x * 1.8 + 0.1)
    
    // Blended (weighted average)
    const blendedProb = 0.6 * marketProb + 0.4 * modelProb
    
    // Confidence interval
    const ci = 5 - Math.abs(x) * 2
    
    points.push({
      line: Math.round(line * 2) / 2, // Round to 0.5
      marketProb: Math.max(5, Math.min(95, marketProb)),
      modelProb: Math.max(5, Math.min(95, modelProb)),
      blendedProb: Math.max(5, Math.min(95, blendedProb)),
      ciLower: Math.max(5, blendedProb - ci),
      ciUpper: Math.min(95, blendedProb + ci),
    })
  }
  
  return points
}