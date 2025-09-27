'use client'

import React from 'react'
import { usePropAnalysis } from '@/contexts/PropAnalysisContext'
import { AnalysisCard } from './AnalysisCard'
import { EdgeChart } from './EdgeChart'
import { EvidencePanel } from './EvidencePanel'
import { VideoPanel } from './VideoPanel'
import { VideoIntelligencePanel } from './VideoIntelligencePanel'

export function Dashboard() {
  const { state } = usePropAnalysis()

  if (!state.currentAnalysis && state.analyses.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-2">Ready to Analyze Props</h2>
          <p className="text-gray-400">
            Search for any player prop above to get real-time fair value analysis with AI-powered insights
          </p>
        </div>
      </div>
    )
  }

  const analysis = state.currentAnalysis || state.analyses[0]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Main Analysis Card */}
      <AnalysisCard analysis={analysis} />
      
      {/* Charts and Evidence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EdgeChart analysis={analysis} />
        <EvidencePanel evidence={analysis.evidenceSnippets} />
      </div>

      {/* Video Panel */}
      <VideoPanel clips={analysis.videoClips} />

      {/* Video Intelligence Panel */}
      <VideoIntelligencePanel />

      {/* Recent Analyses */}
      {state.analyses.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Recent Analyses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.analyses.slice(1, 4).map((analysis) => (
              <AnalysisCard key={analysis.id} analysis={analysis} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
