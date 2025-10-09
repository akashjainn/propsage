/**
 * NFL Evidence Explorer Component
 * 
 * Interactive component to explore Week 5 NFL highlights and evidence
 */

'use client';

import { useState, useEffect } from 'react';

interface NFLEvidenceClip {
  id: string;
  videoId: string;
  t0: number;
  t1: number;
  label: string;
  tags: string[];
  confidence: number;
  actors?: {
    players?: string[];
    teams?: string[];
  };
  context: {
    transcript?: string;
    thumbnail?: string;
  };
  evidenceWeight: number;
  deltaMu: number;
  deltaSigma: number;
}

interface EvidenceSearchResult {
  query: string;
  totalResults: number;
  evidence: NFLEvidenceClip[];
  week: number;
  timestamp: string;
}

const NFL_PROP_TYPES = [
  'rushing_attempts',
  'rushing_yards', 
  'rushing_touchdowns',
  'passing_attempts',
  'passing_yards',
  'passing_touchdowns',
  'receptions',
  'receiving_yards',
  'receiving_touchdowns'
];

const POPULAR_PLAYERS = [
  'Lamar Jackson',
  'Josh Allen', 
  'Christian McCaffrey',
  'Tyreek Hill',
  'Travis Kelce',
  'Derrick Henry',
  'Cooper Kupp',
  'Ja\'Marr Chase'
];

export function NFLEvidenceExplorer() {
  const [searchQuery, setSearchQuery] = useState('touchdown pass red zone');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedPropType, setSelectedPropType] = useState('rushing_touchdowns');
  const [evidence, setEvidence] = useState<NFLEvidenceClip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Search NFL evidence
  const searchEvidence = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '10',
        minScore: '0.6'
      });

      const response = await fetch(`/api/nfl/evidence/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const result: EvidenceSearchResult = await response.json();
      setEvidence(result.evidence);
      setStats({
        totalResults: result.totalResults,
        avgConfidence: result.evidence.length > 0
          ? result.evidence.reduce((sum, e) => sum + e.confidence, 0) / result.evidence.length
          : 0,
        topTags: Array.from(new Set(result.evidence.flatMap(e => e.tags))).slice(0, 8)
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Search by player prop
  const searchPlayerProp = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        propType: selectedPropType,
        limit: '8',
        minScore: '0.6'
      });

      const response = await fetch(`/api/nfl/evidence/player/${encodeURIComponent(selectedPlayer)}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Player search failed: ${response.status}`);
      }

      const result = await response.json();
      setEvidence(result.evidence);
      setStats({
        totalResults: result.totalClips,
        avgConfidence: result.avgConfidence,
        topTags: result.tags
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏈 NFL Evidence Explorer
        </h1>
        <p className="text-gray-600">
          Week 5 NFL highlights powered by TwelveLabs AI
        </p>
      </div>

      {/* Search Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Search NFL Evidence</h2>
        
        {/* Free text search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., 'touchdown pass red zone', 'explosive run 20+ yards'"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchEvidence}
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔍' : 'Search'}
            </button>
          </div>
        </div>

        {/* Player prop search */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Props
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Player...</option>
              {POPULAR_PLAYERS.map(player => (
                <option key={player} value={player}>{player}</option>
              ))}
            </select>
            
            <select
              value={selectedPropType}
              onChange={(e) => setSelectedPropType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {NFL_PROP_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            
            <button
              onClick={searchPlayerProp}
              disabled={loading || !selectedPlayer}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Find Props
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalResults}</div>
              <div className="text-sm text-gray-600">Total Clips</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {(stats.avgConfidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg Confidence</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Top Tags</div>
              <div className="flex flex-wrap justify-center gap-1 mt-1">
                {stats.topTags.slice(0, 4).map((tag: string) => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Searching NFL highlights...</span>
          </div>
        </div>
      )}

      {/* Evidence Results */}
      {evidence.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Evidence Clips ({evidence.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidence.map((clip) => (
              <div key={clip.id} className="bg-white rounded-lg shadow-sm border p-4">
                {/* Thumbnail & Video Info */}
                <div className="mb-3">
                  {clip.context.thumbnail && (
                    <img 
                      src={clip.context.thumbnail}
                      alt="Video thumbnail"
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-gray-600">
                      {formatTime(clip.t0)} - {formatTime(clip.t1)}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(clip.confidence)}`}>
                      {(clip.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {clip.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Players */}
                {clip.actors?.players && clip.actors.players.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Players</div>
                    <div className="text-sm font-medium">
                      {clip.actors.players.slice(0, 2).join(', ')}
                    </div>
                  </div>
                )}

                {/* Evidence Impact */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Weight: {clip.evidenceWeight.toFixed(2)}</div>
                  <div>Δμ: {clip.deltaMu > 0 ? '+' : ''}{clip.deltaMu.toFixed(3)}</div>
                </div>

                {/* Transcript Preview */}
                {clip.context.transcript && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-gray-500 mb-1">Transcript</div>
                    <div className="text-sm text-gray-700">
                      "{clip.context.transcript.substring(0, 100)}..."
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && evidence.length === 0 && stats && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            No evidence clips found. Try different search terms or lower the minimum score.
          </div>
        </div>
      )}
    </div>
  );
}