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
    console.log('HomePage: Games loaded:', gamesToday.length, 'selectedGameId:', selectedGameId);
    if (!selectedGameId && gamesToday.length > 0) {
      console.log('HomePage: Auto-selecting first game:', gamesToday[0].id);
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