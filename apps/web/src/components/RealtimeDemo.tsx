/**
 * Real-time Demo Component
 * Shows how the enhanced PropSage will work with live data
 */

'use client';

import React, { useState } from 'react';
import { FEATURES, isFeatureEnabled } from '@/lib/features';
import { TrendingUp, TrendingDown, Wifi, WifiOff, Clock, Database, Zap } from 'lucide-react';

// Mock the real-time data structure
interface MockPropOffer {
  id: string;
  gameId: string;
  playerName: string;
  team: string;
  position: string;
  market: string;
  book: string;
  line: number;
  overPrice: number;
  underPrice: number;
  fairLine?: number;
  edge?: number;
  confidence?: number;
  lastUpdated: string;
  isLive: boolean;
}

const MOCK_PROPS: MockPropOffer[] = [
  {
    id: 'prop-1',
    gameId: 'uga-alabama-20251006',
    playerName: 'Carson Beck',
    team: 'UGA',
    position: 'QB',
    market: 'Passing Yards',
    book: 'DraftKings',
    line: 285.5,
    overPrice: -110,
    underPrice: -110,
    fairLine: 290.2,
    edge: 0.015,
    confidence: 0.73,
    lastUpdated: new Date().toISOString(),
    isLive: true
  },
  {
    id: 'prop-2', 
    gameId: 'uga-alabama-20251006',
    playerName: 'Jalen Milroe',
    team: 'BAMA',
    position: 'QB', 
    market: 'Rushing Yards',
    book: 'FanDuel',
    line: 45.5,
    overPrice: -105,
    underPrice: -115,
    fairLine: 52.3,
    edge: 0.041,
    confidence: 0.81,
    lastUpdated: new Date().toISOString(),
    isLive: true
  },
  {
    id: 'prop-3',
    gameId: 'uga-alabama-20251006', 
    playerName: 'Ryan Williams',
    team: 'BAMA',
    position: 'WR',
    market: 'Receiving Yards',
    book: 'Caesars',
    line: 75.5,
    overPrice: -120,
    underPrice: +100,
    fairLine: 68.9,
    edge: -0.023,
    confidence: 0.67,
    lastUpdated: new Date().toISOString(),
    isLive: true
  }
];

export function RealtimeDemo() {
  const [props, setProps] = useState<MockPropOffer[]>(MOCK_PROPS);
  const [connected, setConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [simulatingUpdates, setSimulatingUpdates] = useState(false);

  const simulateLineMovement = () => {
    setSimulatingUpdates(true);
    
    const updateProp = (propId: string, lineChange: number, priceChange: number) => {
      setProps(prev => prev.map(p => {
        if (p.id === propId) {
          const newLine = Math.max(0, p.line + lineChange);
          const newOverPrice = p.overPrice + priceChange;
          const newEdge = p.fairLine ? (p.fairLine - newLine) / newLine : p.edge;
          
          return {
            ...p,
            line: newLine,
            overPrice: newOverPrice,
            edge: newEdge,
            lastUpdated: new Date().toISOString()
          };
        }
        return p;
      }));
      setLastUpdate(new Date());
    };

    // Simulate a sequence of updates
    setTimeout(() => updateProp('prop-1', 2.5, -5), 500);   // Beck passing yards up
    setTimeout(() => updateProp('prop-2', -3.0, +10), 1000); // Milroe rushing down
    setTimeout(() => updateProp('prop-3', 1.5, -3), 1500);   // Williams receiving up
    setTimeout(() => updateProp('prop-1', -1.0, +2), 2500);  // Beck slight correction
    setTimeout(() => setSimulatingUpdates(false), 3000);
  };

  const toggleConnection = () => {
    setConnected(!connected);
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatEdge = (edge: number) => {
    const pct = (edge * 100).toFixed(1);
    return edge > 0 ? `+${pct}%` : `${pct}%`;
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Real-time Props Dashboard</h2>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button
              onClick={toggleConnection}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Feature Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Database className={`w-5 h-5 ${isFeatureEnabled('realtime') ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <div className="text-sm font-medium">Real-time Data</div>
              <div className={`text-xs ${isFeatureEnabled('realtime') ? 'text-green-600' : 'text-gray-500'}`}>
                {isFeatureEnabled('realtime') ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Zap className={`w-5 h-5 ${isFeatureEnabled('liveOdds') ? 'text-blue-600' : 'text-gray-400'}`} />
            <div>
              <div className="text-sm font-medium">Live Odds</div>
              <div className={`text-xs ${isFeatureEnabled('liveOdds') ? 'text-blue-600' : 'text-gray-500'}`}>
                {isFeatureEnabled('liveOdds') ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Wifi className={`w-5 h-5 ${isFeatureEnabled('websocket') ? 'text-purple-600' : 'text-gray-400'}`} />
            <div>
              <div className="text-sm font-medium">WebSocket</div>
              <div className={`text-xs ${isFeatureEnabled('websocket') ? 'text-purple-600' : 'text-gray-500'}`}>
                {isFeatureEnabled('websocket') ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <div>
              <div className="text-sm font-medium">Last Update</div>
              <div className="text-xs text-gray-500">
                {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Live Demo Simulation</h3>
            <p className="text-sm text-blue-700">Simulate real-time line movements and prop updates</p>
          </div>
          <button
            onClick={simulateLineMovement}
            disabled={simulatingUpdates || !connected}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              simulatingUpdates || !connected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
            }`}
          >
            {simulatingUpdates ? 'Simulating...' : 'Simulate Movement'}
          </button>
        </div>
      </div>

      {/* Props Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {props.map((prop) => {
          const isPositiveEdge = prop.edge && prop.edge > 0;
          const edgeColor = isPositiveEdge ? 'text-green-600' : 'text-red-600';
          const edgeBg = isPositiveEdge ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
          
          return (
            <div
              key={prop.id}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                connected ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg' : 'border-gray-100 bg-gray-50'
              }`}
            >
              {/* Live Indicator */}
              {prop.isLive && connected && (
                <div className="absolute top-3 right-3 flex items-center space-x-1 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>LIVE</span>
                </div>
              )}

              {/* Player Header */}
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-gray-900">{prop.playerName}</h3>
                <p className="text-sm text-gray-500">{prop.position} • {prop.team}</p>
              </div>

              {/* Market & Book */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">{prop.market}</div>
                <div className="text-xs text-gray-500 uppercase font-medium">{prop.book}</div>
              </div>

              {/* Line & Odds */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Line:</span>
                  <span className="font-bold text-lg">{prop.line}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Over: {formatOdds(prop.overPrice)}</span>
                  <span>Under: {formatOdds(prop.underPrice)}</span>
                </div>
                {prop.fairLine && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Fair:</span>
                    <span className="font-medium">{prop.fairLine.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Edge Display */}
              {prop.edge && (
                <div className={`flex items-center justify-center py-3 px-4 rounded-lg border ${edgeBg} mb-4`}>
                  {isPositiveEdge ? (
                    <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
                  )}
                  <span className={`font-bold text-lg ${edgeColor}`}>
                    {formatEdge(prop.edge)}
                  </span>
                </div>
              )}

              {/* Confidence */}
              {prop.confidence && (
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Confidence</div>
                  <div className={`text-sm font-medium ${
                    prop.confidence > 0.75 ? 'text-green-600' :
                    prop.confidence > 0.65 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {(prop.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Implementation Status */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Implementation Roadmap</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm">Phase 0: Foundation & Feature Flags ✅</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-sm">Phase 1: Live Data Ingestion (In Progress)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
            <span className="text-sm">Phase 2: Real-time Frontend Integration</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
            <span className="text-sm">Phase 3: Advanced Analytics & Intelligence</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
            <span className="text-sm">Phase 4: Production Deployment & Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
}