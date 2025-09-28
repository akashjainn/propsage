'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Play } from 'lucide-react';
import { PropDrawer } from './PropDrawer';

interface GameProp {
  propType: string;
  propLabel: string;
  marketLine: number;
  fairLine: number;
  edgePct: number;
  confidence: 'high' | 'med' | 'low';
  bullets: Array<{ title: string }>;
}

interface Player {
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  props: GameProp[];
}

interface GameDashboardProps {
  gameId: string;
  gameTitle: string;
  onBack: () => void;
}

export default function GameDashboard({ gameId, gameTitle, onBack }: GameDashboardProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProp, setSelectedProp] = useState<{
    playerId: string;
    playerName: string;
    prop: GameProp;
  } | null>(null);

  useEffect(() => {
    // Use the insights API instead of the hardcoded games API
    fetch(`/api/insights/${gameId}`)
      .then(res => res.json())
      .then(data => {
        if (data.players) {
          setPlayers(data.players);
        } else if (data.insights) {
          // Transform insights array into players structure
          const playersMap = new Map();
          data.insights.forEach((prop: any) => {
            if (!playersMap.has(prop.playerId)) {
              playersMap.set(prop.playerId, {
                playerId: prop.playerId,
                playerName: prop.player,
                team: prop.team,
                position: prop.position,
                props: []
              });
            }
            
            // Format propType into a readable label
            const propLabel = prop.propType
              .split('_')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            // Convert confidence number to category
            let confidenceCategory = 'med';
            if (prop.confidence >= 90) confidenceCategory = 'high';
            else if (prop.confidence < 70) confidenceCategory = 'low';
            
            // Transform bullets from string array to object array if needed
            const bulletObjects = prop.bullets.map((bullet: string | { title: string }) => 
              typeof bullet === 'string' ? { title: bullet } : bullet
            );
            
            playersMap.get(prop.playerId).props.push({
              propType: prop.propType,
              propLabel: propLabel,
              marketLine: prop.marketLine,
              fairLine: prop.fairLine,
              edgePct: prop.edge,
              confidence: confidenceCategory,
              bullets: bulletObjects
            });
          });
          setPlayers(Array.from(playersMap.values()));
        } else if (data.props) {
          // Legacy support for old props format
          const playersMap = new Map();
          data.props.forEach((prop: any) => {
            if (!playersMap.has(prop.playerId)) {
              playersMap.set(prop.playerId, {
                playerId: prop.playerId,
                playerName: prop.playerName || prop.player,
                team: prop.team,
                position: prop.position,
                props: []
              });
            }
            playersMap.get(prop.playerId).props.push({
              propType: prop.propType || prop.stat,
              propLabel: prop.propLabel || prop.label,
              marketLine: prop.marketLine || prop.line,
              fairLine: prop.fairLine,
              edgePct: prop.edgePct || prop.edge,
              confidence: prop.confidence || 'med',
              bullets: prop.bullets || []
            });
          });
          setPlayers(Array.from(playersMap.values()));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load game props:', err);
        setLoading(false);
      });
  }, [gameId]);

  const handlePropSelect = (playerId: string, playerName: string, prop: GameProp) => {
    setSelectedProp({ playerId, playerName, prop });
  };

  const getEdgeColor = (edgePct: number) => {
    if (Math.abs(edgePct) < 5) return 'text-gray-600';
    return edgePct > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getEdgeBg = (edgePct: number) => {
    if (Math.abs(edgePct) < 5) return 'bg-gray-50 border-gray-200';
    return edgePct > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-100 text-green-700 border-green-200',
      med: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return colors[confidence as keyof typeof colors] || colors.low;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold">{gameTitle} Props</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded mb-4"></div>
                <div className="h-8 bg-white/10 rounded mb-4"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded mb-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold">{gameTitle}</h1>
              <p className="text-white/60">Market vs Fair Line Analysis</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/60">Total Props</div>
            <div className="text-2xl font-bold">{players.reduce((sum, p) => sum + p.props.length, 0)}</div>
          </div>
        </div>

        {/* Top Edges Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Top Edge Opportunities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players
              .flatMap(player => 
                player.props.map(prop => ({ ...prop, playerId: player.playerId, playerName: player.playerName, team: player.team, position: player.position }))
              )
              .sort((a, b) => Math.abs(b.edgePct) - Math.abs(a.edgePct))
              .slice(0, 3)
              .map((prop, i) => (
                <button
                  key={`${prop.playerId}-${prop.propType}`}
                  onClick={() => handlePropSelect(prop.playerId, prop.playerName, prop)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${getEdgeBg(prop.edgePct)} hover:shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">#{i + 1} Edge</span>
                    <span className={`text-lg font-bold ${getEdgeColor(prop.edgePct)}`}>
                      {prop.edgePct > 0 ? '+' : ''}{prop.edgePct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{prop.playerName}</div>
                    <div className="text-sm text-gray-600">{prop.propLabel}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Market: {prop.marketLine} → Fair: {prop.fairLine}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* All Players Grid */}
        <div className="space-y-8">
          {players.map(player => (
            <div key={player.playerId} className="bg-white/5 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold">
                  {player.playerName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{player.playerName}</h3>
                  <p className="text-white/60">{player.position} • {player.team}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm text-white/60">Props Available</div>
                  <div className="text-lg font-bold">{player.props.length}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {player.props.map(prop => (
                  <button
                    key={prop.propType}
                    onClick={() => handlePropSelect(player.playerId, player.playerName, prop)}
                    className={`p-4 rounded-lg border transition-all hover:scale-105 hover:shadow-lg ${getEdgeBg(prop.edgePct)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceBadge(prop.confidence)}`}>
                        {prop.confidence.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1">
                        {Math.abs(prop.edgePct) > 10 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : Math.abs(prop.edgePct) > 5 ? (
                          <Target className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-gray-400" />
                        )}
                        <Play className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="font-semibold text-gray-900 mb-1">{prop.propLabel}</div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Market: {prop.marketLine}</span>
                        <span className="text-gray-600">Fair: {prop.fairLine}</span>
                      </div>
                      <div className={`text-center py-1 px-2 rounded font-bold ${getEdgeColor(prop.edgePct)} bg-white/50`}>
                        {prop.edgePct > 0 ? 'OVER' : 'UNDER'} {Math.abs(prop.edgePct).toFixed(1)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PropDrawer */}
      {selectedProp && (
        <PropDrawer
          isOpen={!!selectedProp}
          onClose={() => setSelectedProp(null)}
          propId={`${gameId}-${selectedProp.playerId}-${selectedProp.prop.propType}`}
          propType={selectedProp.prop.propLabel as any}
          playerId={selectedProp.playerId}
          gameId={gameId}
          marketLine={selectedProp.prop.marketLine}
          fairLine={selectedProp.prop.fairLine}
          edgePct={selectedProp.prop.edgePct}
          bullets={selectedProp.prop.bullets.map(b => b.title)}
          clips={[]}
        />
      )}
    </div>
  );
}