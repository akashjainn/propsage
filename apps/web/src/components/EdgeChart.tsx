'use client'

import React, { useState, useEffect } from 'react'
import { PropAnalysis } from '@/contexts/PropAnalysisContext'

interface EdgeChartProps {
  analysis: PropAnalysis
}

export function EdgeChart({ analysis }: EdgeChartProps) {
  const [liveEdge, setLiveEdge] = useState(analysis.edge)
  
  useEffect(() => {
    // Simulate live edge updates
    const interval = setInterval(() => {
      setLiveEdge(prev => prev + (Math.random() - 0.5) * 0.5)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const generateSparklineData = () => {
    const data = []
    for (let i = 0; i < 20; i++) {
      data.push(analysis.edge + (Math.random() - 0.5) * 2)
    }
    return data
  }

  const sparklineData = generateSparklineData()
  const maxVal = Math.max(...sparklineData)
  const minVal = Math.min(...sparklineData)

  return (
    <div className="glass rounded-xl p-6 glow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Edge Analysis</h3>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">Live Updates</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Edge Display */}
        <div className="text-center">
          <div className="text-4xl font-bold text-green-400 mb-2">
            +{liveEdge.toFixed(1)}%
          </div>
          <div className="text-gray-400">Current Edge</div>
        </div>

        {/* Sparkline Chart */}
        <div className="relative h-24 bg-gray-800/30 rounded-lg p-4">
          <svg width="100%" height="100%" className="overflow-visible">
            <polyline
              fill="none"
              stroke="rgb(34, 197, 94)"
              strokeWidth="2"
              points={sparklineData.map((val, i) => {
                const x = (i / (sparklineData.length - 1)) * 100
                const y = 100 - ((val - minVal) / (maxVal - minVal)) * 100
                return `${x},${y}`
              }).join(' ')}
            />
          </svg>
          
          <div className="absolute top-2 left-2 text-xs text-gray-400">
            Max: +{maxVal.toFixed(1)}%
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-gray-400">
            Min: +{minVal.toFixed(1)}%
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-800/30 rounded-lg">
            <div className="text-lg font-bold text-white">{(analysis.confidence * 100).toFixed(0)}%</div>
            <div className="text-xs text-gray-400">Confidence</div>
          </div>
          <div className="text-center p-3 bg-gray-800/30 rounded-lg">
            <div className="text-lg font-bold text-yellow-400">2.3%</div>
            <div className="text-xs text-gray-400">Volatility</div>
          </div>
        </div>
      </div>
    </div>
  )
}
