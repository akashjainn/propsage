'use client'

import React from 'react'
import { VideoClip } from '@/contexts/PropAnalysisContext'

interface VideoPanelProps {
  clips: VideoClip[]
}

export function VideoPanel({ clips }: VideoPanelProps) {
  return (
    <div className="glass rounded-xl p-6 glow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Similar Scenarios</h3>
        <span className="text-xs text-gray-400">{clips.length} clips found</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map((clip) => (
          <div key={clip.id} className="group cursor-pointer">
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-2">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl" aria-hidden="true">🎬</div>
              </div>
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-2xl">▶️</div>
              </div>
              
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {clip.duration}s
              </div>
              
              <div className="absolute top-2 left-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded">
                {(clip.relevanceScore * 100).toFixed(0)}% match
              </div>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-white line-clamp-2">
                {clip.title}
              </h4>
              <p className="text-xs text-gray-400">
                Relevance: {(clip.relevanceScore * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
        <div className="flex items-start space-x-2">
          <div className="text-purple-400 mt-0.5" aria-hidden="true">🎥</div>
          <div>
            <p className="text-sm text-purple-300 font-medium">Video Analysis</p>
            <p className="text-xs text-purple-200/80 mt-1">
              Similar game situations show successful drives against comparable defensive schemes. 
              High correlation with projected performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
