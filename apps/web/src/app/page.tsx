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
    
    // Handle player search - find their game and show dashboard
    if (result.type === 'player') {
      console.log('Player selected:', result.title, 'Team:', result.metadata?.team);
      
      // Find game with this team
      const matchingGame = gamesToday.find(game => 
        game.home.short === result.metadata?.team || 
        game.away.short === result.metadata?.team ||
        game.home.name.toLowerCase().includes(result.metadata?.team?.toLowerCase() || '') ||
        game.away.name.toLowerCase().includes(result.metadata?.team?.toLowerCase() || '')
      );
      
      if (matchingGame) {
        console.log('Found matching game:', matchingGame.id);
        handleGameSelect(matchingGame.id);
      } else {
        console.log('No matching game found, using first available game');
        if (gamesToday.length > 0) {
          handleGameSelect(gamesToday[0].id);
        }
      }
    }
    
    // Handle team search - find matching game
    else if (result.type === 'team' || result.type === 'game') {
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
    
    // Handle prop search - show prop analysis in EdgeEvidenceDrawer
    else if (result.type === 'prop' && result.propData) {
      console.log('Prop selected:', result.title, 'Prop data:', result.propData);
      
      // Create edge object from prop data for EdgeEvidenceDrawer
      const edge = {
        id: result.propData.id,
        player: result.propData.player,
        team: result.propData.team,
        market: result.propData.market,
        marketLine: result.propData.marketLine,
        fairLine: result.propData.fairLine,
        edgePct: result.propData.edgePct,
        confidence: result.propData.confidence,
        gameId: result.propData.gameId,
        gameTitle: result.propData.gameTitle,
        bullets: result.propData.bullets,
        analysis: result.propData.analysis,
        normalizedMarket: result.propData.market
      };
      
      // Open the evidence drawer with this prop's analysis
      handleEdgeSelect(edge);
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
      <section className="mb-12 text-center relative">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-surface opacity-60 rounded-3xl" />
        
        <div className="relative z-10 py-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            We analyze 
            <span className="text-gradient animate-gradient-shift bg-gradient-brand bg-[length:200%_200%]"> game film </span>
            to show where the market is wrong.
          </h1>
          <p className="text-xl text-[var(--fg-dim)] mb-8 max-w-3xl mx-auto">
            Compare market lines with our fair lines, then watch the plays that justify it.
          </p>
          
          {/* Search CTA */}
          <div className="flex justify-center">
            <button 
              onClick={search.open}
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-primary hover:shadow-primary hover:scale-105 rounded-xl font-semibold text-[var(--fg)] transition-all duration-300 hover:-translate-y-1 focus:ring-2 focus:ring-primary-400/50 focus:outline-none"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search teams, players, or props</span>
              <kbd className="px-2 py-1 text-xs bg-black/20 rounded font-mono">⌘K</kbd>
            </button>
          </div>
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