'use client'

import React from 'react'
import { EvidenceSnippet } from '@/contexts/PropAnalysisContext'

interface EvidencePanelProps {
  evidence: EvidenceSnippet[]
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  return (
    <div className="glass rounded-xl p-6 glow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">News Evidence</h3>
        <span className="text-xs text-gray-400">{evidence.length} sources</span>
      </div>

      <div className="space-y-4">
        {evidence.map((snippet, index) => (
          <div key={snippet.id} className="border-l-4 border-green-500/50 pl-4 py-2">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-green-400">{snippet.source}</span>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-400">
                  Weight: {(snippet.weight * 100).toFixed(0)}%
                </div>
                <div className="h-1 w-8 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-400"
                    style={{ width: `${snippet.weight * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              {snippet.text}
            </p>
            
            <a 
              href={snippet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Read full article →
            </a>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
        <div className="flex items-start space-x-2">
          <div className="text-blue-400 mt-0.5">🧠</div>
          <div>
            <p className="text-sm text-blue-300 font-medium">AI Summary</p>
            <p className="text-xs text-blue-200/80 mt-1">
              Evidence suggests favorable matchup with increased usage expected. 
              Defensive metrics support over projection.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
