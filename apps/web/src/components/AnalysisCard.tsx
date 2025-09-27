'use client'

import React from 'react'
import { PropAnalysis } from '@/contexts/PropAnalysisContext'

interface AnalysisCardProps {
  analysis: PropAnalysis
  compact?: boolean
}

export function AnalysisCard({ analysis, compact = false }: AnalysisCardProps) {
  const edgeColor = analysis.edge > 0 ? 'text-green-400' : 'text-red-400'
  const edgeSign = analysis.edge > 0 ? '+' : ''

  return (
    <div className={`glass rounded-xl p-6 glow ${compact ? 'p-4' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`font-bold text-white ${compact ? 'text-lg' : 'text-2xl'}`}>
            {analysis.playerName}
          </h3>
          <p className={`text-gray-400 ${compact ? 'text-sm' : 'text-base'}`}>
            {analysis.market} {analysis.marketLine} O/U
          </p>
        </div>
        
        <div className="text-right">
          <div className={`font-bold ${edgeColor} ${compact ? 'text-lg' : 'text-2xl'}`}>
            {edgeSign}{analysis.edge.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Edge</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-800/30 rounded-lg">
          <div className="text-xl font-bold text-white">{analysis.marketLine}</div>
          <div className="text-xs text-gray-400">Market Line</div>
        </div>
        
        <div className="text-center p-3 bg-gray-800/30 rounded-lg">
          <div className="text-xl font-bold text-green-400">{analysis.fairLine}</div>
          <div className="text-xs text-gray-400">Fair Line</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-16 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-400 transition-all duration-500"
              style={{ width: `${analysis.confidence * 100}%` }}
            />
          </div>
          <span className="text-gray-400">
            {(analysis.confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
        
        <div className="text-gray-400">
          {analysis.evidenceSnippets.length} sources
        </div>
      </div>
    </div>
  )
}
