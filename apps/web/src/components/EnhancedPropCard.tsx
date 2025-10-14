// PropCard UI Component - Enhanced with Live Alignment Data
// Shows current prop progress, line movement, and evidence clips
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface PropProgress {
  current: number;
  line: number;
  edge: number;
  book: string;
  totalPlays: number;
  lastPlayId?: string;
}

interface EvidenceClip {
  id: string;
  pbpId: string;
  clipUrl?: string;
  note?: string;
  delta: number;
  timestamp: string;
}

interface EnhancedPropCardProps {
  gameId: number;
  playerId: string;
  playerName: string;
  marketKey: string;
  team?: string;
  initialProgress?: PropProgress;
}

export default function EnhancedPropCard({ 
  gameId, 
  playerId, 
  playerName, 
  marketKey, 
  team,
  initialProgress 
}: EnhancedPropCardProps) {
  const [progress, setProgress] = useState<PropProgress | null>(initialProgress || null);
  const [evidence, setEvidence] = useState<EvidenceClip[]>([]);
  const [showEvidence, setShowEvidence] = useState(false);
  const [loading, setLoading] = useState(!initialProgress);

  // Fetch live progress data
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/alignment/progress/${gameId}/${playerId}/${marketKey}`);
        const data = await response.json();
        
        if (data.progress) {
          setProgress({
            current: data.progress.current,
            line: data.lines[0]?.line?.line || 0,
            edge: data.edge[0]?.edge || 0,
            book: data.lines[0]?.book || '',
            totalPlays: data.progress.totalPlays || 0,
            lastPlayId: data.progress.lastPlayId
          });
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialProgress) {
      fetchProgress();
    }

    // Set up polling for live updates
    const interval = setInterval(fetchProgress, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [gameId, playerId, marketKey, initialProgress]);

  // Fetch evidence clips when expanded
  useEffect(() => {
    if (showEvidence && evidence.length === 0) {
      const fetchEvidence = async () => {
        try {
          const response = await fetch(`/api/alignment/evidence/${playerId}/${marketKey}`);
          const data = await response.json();
          setEvidence(data.evidence || []);
        } catch (error) {
          console.error('Failed to fetch evidence:', error);
        }
      };
      fetchEvidence();
    }
  }, [showEvidence, playerId, marketKey, evidence.length]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded mb-2"></div>
        <div className="h-6 bg-white/10 rounded mb-2"></div>
        <div className="h-2 bg-white/10 rounded"></div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/60 text-sm">No data available</div>
      </div>
    );
  }

  const progressPercent = progress.line > 0 ? Math.min((progress.current / progress.line) * 100, 100) : 0;
  const isOver = progress.current > progress.line;
  const edgeColor = progress.edge > 0 ? 'text-green-400' : progress.edge < 0 ? 'text-red-400' : 'text-white/60';

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-medium text-white">{playerName}</div>
          <div className="text-xs text-white/60">{team} • {marketKey.replace(/([A-Z])/g, ' $1').trim()}</div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-mono ${edgeColor}`}>
            {progress.edge > 0 ? '+' : ''}{progress.edge.toFixed(1)}
          </div>
          <div className="text-xs text-white/60">{progress.book}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-white/80">Current: {progress.current.toFixed(1)}</span>
          <span className="text-sm text-white/80">Line: {progress.line.toFixed(1)}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              isOver ? 'bg-green-400' : 'bg-blue-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-white/60 mt-1">
          {progress.totalPlays} plays affecting this prop
        </div>
      </div>

      {/* Evidence Toggle */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showEvidence ? 'Hide' : 'Show'} Evidence ({evidence.length} clips)
        </button>
        <Link 
          href={`/nfl/players/${playerId}?gameId=${gameId}`}
          className="text-xs text-white/60 hover:text-white transition-colors"
        >
          View Details →
        </Link>
      </div>

      {/* Evidence Clips */}
      {showEvidence && (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {evidence.length === 0 ? (
            <div className="text-xs text-white/60">Loading evidence...</div>
          ) : (
            evidence.slice(0, 5).map((clip) => (
              <div key={clip.id} className="flex items-center justify-between text-xs">
                <div className="flex-1">
                  <div className="text-white/80">{clip.note}</div>
                  <div className="text-white/50">Play {clip.pbpId.split(':')[1]}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-mono ${clip.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {clip.delta > 0 ? '+' : ''}{clip.delta}
                  </span>
                  {clip.clipUrl && (
                    <a 
                      href={clip.clipUrl} 
                      target="_blank" 
                      className="text-blue-400 hover:text-blue-300"
                    >
                      📹
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}