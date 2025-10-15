
import React from 'react';
import { fetchGamesForWeek } from '@/lib/nfl';
import { getNFLContext } from '@/lib/nflConfig';


export default async function HomePage() {
  const { season, week } = getNFLContext();
  const { data: games } = await fetchGamesForWeek();
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Week {week} Games ({season})</h2>
        {!games?.length ? (
          <div className="mt-3 text-gray-500">No games available for Week {week} (fixtures may be minimal).</div>
        ) : (
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map(g => (
              <li key={g.id} className="rounded-lg border bg-white p-4">
                <div className="font-medium">{g.awayTeam} @ {g.homeTeam}</div>
                <div className="text-sm text-gray-500">{new Date(g.kickoff).toLocaleString()}</div>
                {"homeScore" in g && "awayScore" in g ? (
                  <div className="mt-1 text-sm">Final: {g.awayScore}–{g.homeScore}</div>
                ) : null}
              </li>
            ))}
                      </ul>
                    )}
                  </section>
                </main>
              );
            }
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
        gameId: result.propData.gameId || selectedGameId,
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
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>}>
        <GameDashboard
          ref={dashboardRef}
          gameId={selectedGameId}
          gameTitle={gameTitle}
          onBack={() => setShowGameDashboard(false)}
        />
      </Suspense>
    );
  }

  return (
    <AppShell>
      {/* NFL Hero Section */}
      <section className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/2 p-8 shadow-lg backdrop-blur-sm">
        <h2 className="text-3xl font-bold mb-2">🏈 NFL Props</h2>
        <p className="text-[var(--fg-dim)] mb-6">Explore NFL player prop lines with matched highlight clips and video evidence.</p>
        <Link
          href="/nfl"
          className="inline-flex items-center rounded-lg border border-transparent bg-white text-black px-6 py-3 font-semibold hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          Explore NFL Props
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

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
  <section className="mb-12 space-y-6" id="insights">
        <div>
          <SectionHeader
            title="Top Edge Opportunities"
            subtitle="Market vs fair line discrepancies backed by video evidence"
          />
          {FEATURES.topEdges ? (
            <Suspense fallback={<div className="animate-pulse bg-white/5 rounded-xl h-32" />}>
              <TopEdgesList gameId={selectedGameId} onSelect={handleEdgeSelect} />
            </Suspense>
          ) : (
            <div className="text-sm text-white/60">Top edges feature disabled.</div>
          )}
        </div>
      </section>

      {/* Games Rail */}
  <section className="mb-8" id="players">
        <SectionHeader 
          title="Today's Games" 
          subtitle="Select a game to analyze props and watch video evidence" 
        />
        <Suspense fallback={<div className="animate-pulse bg-white/5 rounded-xl h-20" />}>
          <GamesRail 
            games={gamesToday}
            selectedGameId={selectedGameId || ''}
            onGameSelect={handleGameSelect}
            loading={loadingGames}
          />
        </Suspense>
      </section>

      {/* Search Modal */}
      <Suspense fallback={null}>
        <SearchModal 
          isOpen={search.isOpen} 
          onClose={search.close} 
          onSelect={handleSearchSelect} 
        />
      </Suspense>

      <Suspense fallback={null}>
        <EdgeEvidenceDrawer
          edge={selectedEdge}
          gameTitle={(() => {
            // Prefer edge.gameId if present (prop from different game than currently selected)
            const targetGameId = selectedEdge?.gameId || selectedGameId;
              const g = gamesToday.find(g => g.id === targetGameId);
              return g ? `${g.away.short} @ ${g.home.short}` : null;
          })()}
          open={evidenceOpen}
          onClose={() => setEvidenceOpen(false)}
        />
      </Suspense>
    </AppShell>
  );
}