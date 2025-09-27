"use client"
import React, { useState, useEffect, useRef } from 'react';
import { formatDuration } from '../lib/clips';

// Types for evidence system
export interface TLMoment {
  id: string;
  videoId: string;
  startTime: number;
  endTime: number;
  score: number;
  label: string;
  query: string;
  thumbnailUrl?: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface MomentPack {
  id: string;
  playerId: string;
  propType: string;
  moments: TLMoment[];
  metadata: {
    totalMoments: number;
    avgConfidence: number;
    lastUpdated: Date;
    queries: string[];
  };
}

export interface PropEvidence {
  propId: string;
  momentPacks: MomentPack[];
  features: Array<{
    name: string;
    value: number;
    unit: string;
    description: string;
    confidence: 'low' | 'medium' | 'high';
  }>;
  summary: {
    totalMoments: number;
    avgConfidence: number;
    riskFactors: string[];
    supportFactors: string[];
  };
  available?: boolean;
}

interface EvidenceRailProps {
  propId?: string;
  playerId?: string;
  propType?: string;
  className?: string;
  onMomentClick?: (moment: TLMoment) => void;
  showAskTape?: boolean;
}

export function EvidenceRail({ 
  propId, 
  playerId, 
  propType, 
  className = "",
  onMomentClick,
  showAskTape = true
}: EvidenceRailProps) {
  const [evidence, setEvidence] = useState<PropEvidence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askTapeQuery, setAskTapeQuery] = useState('');
  const [askTapeMoments, setAskTapeMoments] = useState<TLMoment[]>([]);
  const [askTapeLoading, setAskTapeLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propId) {
      loadEvidence();
    }
  }, [propId]);

  const loadEvidence = async () => {
    if (!propId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cfb/evidence/prop/${propId}`);
      if (!response.ok) {
        throw new Error(`Failed to load evidence: ${response.status}`);
      }
      
      const data = await response.json();
      setEvidence(data);
    } catch (err) {
      console.error('Failed to load evidence:', err);
      setError(err instanceof Error ? err.message : 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  const handleAskTape = async () => {
    if (!askTapeQuery.trim()) return;
    
    setAskTapeLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cfb/evidence/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: askTapeQuery,
          limit: 6
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAskTapeMoments(data.moments || []);
      }
    } catch (error) {
      console.error('Ask the Tape failed:', error);
    } finally {
      setAskTapeLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return '🎯';
      case 'medium': return '⚡';
      case 'low': return '💭';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-32 bg-white/10 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-white/5 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <EvidenceChipSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !evidence) {
    return (
      <div className={`text-center p-6 rounded-xl bg-[var(--card)] ring-1 ring-white/10 ${className}`}>
        <div className="text-[var(--fg-dim)] mb-2">📹 Video Evidence</div>
        <div className="text-sm text-[var(--fg-dim)]">
          {error || 'Video intelligence not available'}
        </div>
        {showAskTape && (
          <div className="mt-4">
            <AskTapeBox 
              onSearch={handleAskTape}
              loading={askTapeLoading}
              query={askTapeQuery}
              setQuery={setAskTapeQuery}
            />
            {askTapeMoments.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {askTapeMoments.map(moment => (
                  <EvidenceChip 
                    key={moment.id}
                    moment={moment}
                    onClick={onMomentClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const allMoments = evidence.momentPacks.flatMap(pack => pack.moments);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-[var(--fg)]">📹 Video Evidence</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--fg-dim)]">
              {evidence.summary.totalMoments} moments
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--iris)]/20 text-[var(--iris)]">
              {Math.round(evidence.summary.avgConfidence * 100)}% avg confidence
            </span>
          </div>
        </div>
      </div>

      {/* Evidence Features */}
      {evidence.features.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {evidence.features.map((feature, i) => (
            <div 
              key={i}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getConfidenceColor(feature.confidence)}`}
              title={feature.description}
            >
              {feature.name}: {feature.value} {feature.unit}
            </div>
          ))}
        </div>
      )}

      {/* Moment Chips Rail */}
      {allMoments.length > 0 && (
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
        >
          {allMoments.slice(0, 8).map(moment => (
            <EvidenceChip 
              key={moment.id}
              moment={moment}
              onClick={onMomentClick}
            />
          ))}
        </div>
      )}

      {/* Risk/Support Factors */}
      {(evidence.summary.riskFactors.length > 0 || evidence.summary.supportFactors.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evidence.summary.supportFactors.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-green-400">✅ Supporting Evidence</div>
              {evidence.summary.supportFactors.map((factor, i) => (
                <div key={i} className="text-sm text-[var(--fg-dim)]">• {factor}</div>
              ))}
            </div>
          )}
          {evidence.summary.riskFactors.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-red-400">⚠️ Risk Factors</div>
              {evidence.summary.riskFactors.map((factor, i) => (
                <div key={i} className="text-sm text-[var(--fg-dim)]">• {factor}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ask the Tape */}
      {showAskTape && (
        <div className="border-t border-white/10 pt-4">
          <AskTapeBox 
            onSearch={handleAskTape}
            loading={askTapeLoading}
            query={askTapeQuery}
            setQuery={setAskTapeQuery}
          />
          {askTapeMoments.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {askTapeMoments.map(moment => (
                <EvidenceChip 
                  key={moment.id}
                  moment={moment}
                  onClick={onMomentClick}
                  variant="custom"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface EvidenceChipProps {
  moment: TLMoment;
  onClick?: (moment: TLMoment) => void;
  variant?: 'default' | 'custom';
}

function EvidenceChip({ moment, onClick, variant = 'default' }: EvidenceChipProps) {
  return (
    <div 
      className={`
        flex-shrink-0 w-40 cursor-pointer group transition-all duration-200
        ${variant === 'custom' ? 'opacity-80 hover:opacity-100' : ''}
      `}
      onClick={() => onClick?.(moment)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 mb-2">
        {moment.thumbnailUrl ? (
          <img 
            src={moment.thumbnailUrl}
            alt={moment.label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            🎬
          </div>
        )}
        
        {/* Duration badge */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
          {formatDuration(Math.round(moment.endTime - moment.startTime))}
        </div>
        
        {/* Confidence badge */}
        <div className={`absolute top-1 left-1 px-1.5 py-0.5 text-xs rounded-full ${
          moment.confidence === 'high' ? 'bg-green-500/80 text-white' :
          moment.confidence === 'medium' ? 'bg-yellow-500/80 text-black' :
          'bg-red-500/80 text-white'
        }`}>
          {(() => {
            switch (moment.confidence) {
              case 'high': return '🎯';
              case 'medium': return '⚡';
              case 'low': return '💭';
              default: return '📊';
            }
          })()}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
          </div>
        </div>
      </div>

      {/* Label and metadata */}
      <div className="space-y-1">
        <div className="text-xs font-medium text-[var(--fg)] line-clamp-2 leading-tight">
          {moment.label}
        </div>
        <div className="text-xs text-[var(--fg-dim)] flex items-center justify-between">
          <span>Score: {Math.round(moment.score * 100)}</span>
          <span className="capitalize">{moment.confidence}</span>
        </div>
      </div>
    </div>
  );
}

interface AskTapeBoxProps {
  onSearch: () => void;
  loading: boolean;
  query: string;
  setQuery: (query: string) => void;
}

function AskTapeBox({ onSearch, loading, query, setQuery }: AskTapeBoxProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-[var(--fg)]">🎤 Ask the Tape</div>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g., "QB scrambles on 3rd down", "deep passes under pressure"'
          className="flex-1 rounded-lg bg-[var(--card)] text-[var(--fg)]
                     placeholder-[var(--muted)] border border-white/10 px-3 py-2
                     focus:ring-2 focus:ring-[var(--iris)] focus:outline-none text-sm"
          onKeyDown={(e) => e.key === 'Enter' && !loading && onSearch()}
        />
        <button
          onClick={onSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-[var(--iris)]/90 hover:bg-[var(--iris)] 
                     rounded-lg transition disabled:opacity-50 text-sm font-medium"
        >
          {loading ? '🔍' : 'Search'}
        </button>
      </div>
    </div>
  );
}

function EvidenceChipSkeleton() {
  return (
    <div className="flex-shrink-0 w-40">
      <div className="aspect-video rounded-lg bg-white/5 animate-pulse mb-2"></div>
      <div className="space-y-1">
        <div className="h-3 bg-white/10 rounded animate-pulse"></div>
        <div className="h-2 bg-white/5 rounded animate-pulse w-2/3"></div>
      </div>
    </div>
  );
}