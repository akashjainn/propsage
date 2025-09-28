'use client';

import React, { useState, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AppShell, SectionHeader } from '@/ui';
import TopEdgesList from '@/components/TopEdgesList';
import EdgeEvidenceDrawer from '@/components/EdgeEvidenceDrawer';
import { FEATURES } from '@/lib/features';
import GameDashboard, { GameDashboardHandle } from '@/components/GameDashboard';
import { useRef } from 'react';
import GamesRail from '@/components/GamesRail';
import SearchModal, { useSearch } from '@/components/SearchModal';
import type { GameLite } from '@/types/cfb';
import { ENDPOINTS } from '@/lib/api';
import { useGamesToday } from '@/hooks/useGamesToday';

export default function HomePage() {
  const { games: gamesToday, loading: loadingGames } = useGamesToday({ pollIntervalMs: 120000 });
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [showGameDashboard, setShowGameDashboard] = useState(false);
  const search = useSearch();
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const dashboardRef = useRef<GameDashboardHandle>(null);
  
  // Auto-select first game when games load
  useEffect(() => {
    if (!selectedGameId && gamesToday.length > 0) {
      setSelectedGameId(gamesToday[0].id);
    }
  }, [gamesToday, selectedGameId]);

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId);
    setShowGameDashboard(true);
  };

  const handleEdgeSelect = (edge: any) => {
    Sentry.addBreadcrumb({ category: 'edge', level: 'info', message: 'edge_selected', data: { player: edge.player, market: edge.market } });
    setSelectedEdge(edge);
    if (edge?.gameId && edge.gameId !== selectedGameId) {
      setSelectedGameId(edge.gameId);
    }
    setEvidenceOpen(true);
    dashboardRef.current?.focusProp(edge?.normalizedMarket ?? edge?.market);
  };

  const handleSearchSelect = (result: any) => {
    console.log('Search selected:', result);
    // Handle team search - find matching game
    if (result.type === 'team' || result.type === 'game') {
      const matchingGame = gamesToday.find(game => 
        game.home.name.toLowerCase().includes(result.title.toLowerCase()) ||
        game.away.name.toLowerCase().includes(result.title.toLowerCase()) ||
        game.home.short.toLowerCase().includes(result.title.toLowerCase()) ||
        game.away.short.toLowerCase().includes(result.title.toLowerCase())
      );
      
      if (matchingGame) {
        handleGameSelect(matchingGame.id);
      }
    }
    search.close();
  };

  // If viewing game dashboard, show that instead
  if (showGameDashboard && selectedGameId) {
    const selectedGame = gamesToday.find(g => g.id === selectedGameId);
    const gameTitle = selectedGame 
      ? `${selectedGame.away.short} @ ${selectedGame.home.short}`
      : 'Selected Game';

    return (
      <GameDashboard
        ref={dashboardRef}
        gameId={selectedGameId}
        gameTitle={gameTitle}
        onBack={() => setShowGameDashboard(false)}
      />
    );
  }

  return (
    <AppShell>
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          We analyze game film to show where the market is wrong.
        </h1>
        <p className="text-xl text-white/70 mb-8">
          Compare market lines with our fair lines, then watch the plays that justify it.
        </p>
        
        {/* Search CTA */}
        <div className="flex justify-center">
          <button 
            onClick={search.open}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search teams, players, or props</span>
            <kbd className="px-2 py-1 text-xs bg-white/20 rounded">⌘K</kbd>
          </button>
        </div>
      </section>

      {/* Top Edges */}
      <section className="mb-12 space-y-6">
        <div>
          <SectionHeader
            title="Top Edge Opportunities"
            subtitle="Market vs fair line discrepancies backed by video evidence"
          />
          {FEATURES.topEdges ? (
            <TopEdgesList gameId={selectedGameId} onSelect={handleEdgeSelect} />
          ) : (
            <div className="text-sm text-white/60">Top edges feature disabled.</div>
          )}
        </div>
      </section>

      {/* Games Rail */}
      <section className="mb-8">
        <SectionHeader 
          title="Today's Games" 
          subtitle="Select a game to analyze props and watch video evidence" 
        />
        <GamesRail 
          games={gamesToday}
          selectedGameId={selectedGameId || ''}
          onGameSelect={handleGameSelect}
          loading={loadingGames}
        />
        
        {gamesToday.length > 0 && selectedGameId && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowGameDashboard(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors"
            >
              Analyze {gamesToday.find(g => g.id === selectedGameId)?.away.short} @ {gamesToday.find(g => g.id === selectedGameId)?.home.short} Props
            </button>
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">94.2%</div>
            <div className="text-sm text-white/70">Model Accuracy</div>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">15.7%</div>
            <div className="text-sm text-white/70">Average Edge</div>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">1,200+</div>
            <div className="text-sm text-white/70">Video Clips Analyzed</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-12">
        <SectionHeader 
          title="How It Works" 
          subtitle="Our three-step process to find profitable prop bets" 
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-400">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analyze Market Lines</h3>
            <p className="text-white/70">We pull real-time odds from major sportsbooks and identify pricing inefficiencies.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-400">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Calculate Fair Value</h3>
            <p className="text-white/70">Our models compute true probability based on player stats, matchups, and game conditions.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-400">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Show Video Proof</h3>
            <p className="text-white/70">Watch actual game footage that supports our analysis and edge recommendations.</p>
          </div>
        </div>
      </section>

      {/* Search Modal */}
      <SearchModal 
        isOpen={search.isOpen} 
        onClose={search.close} 
        onSelect={handleSearchSelect} 
      />

      <EdgeEvidenceDrawer
        edge={selectedEdge}
        gameTitle={(() => {
          const g = gamesToday.find(g => g.id === selectedGameId);
          return g ? `${g.away.short} vs ${g.home.short}` : null;
        })()}
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
      />
    </AppShell>
  );
}