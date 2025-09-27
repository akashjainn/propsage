'use client';

import React, { useState, useEffect } from 'react';
import MatchupHero from '@/components/MatchupHero';
import SearchModal, { useSearch } from '@/components/SearchModal';
import ClipsGrid from '@/components/ClipsGrid';
import WhyCard from '@/components/WhyCard';
import { useFastSWR, preloadResources, trackWebVitals } from '@/hooks/usePerformance';
import { TrendingUp, TrendingDown, Play, Search, Command } from 'lucide-react';

// Demo data matching the exact demo flow
const DEMO_GAME = {
  homeTeam: {
    name: 'Alabama Crimson Tide',
    shortName: 'BAMA',
    logo: '/images/alabama-logo.png',
    color: '#9E1B32',
    record: '11-2',
    ranking: 5
  },
  awayTeam: {
    name: 'Georgia Bulldogs',
    shortName: 'UGA',
    logo: '/images/uga-logo.png',
    color: '#BA0C2F',
    record: '12-1',
    ranking: 2
  },
  gameTime: '2024-12-07T20:00:00-05:00', // Tonight 8 PM
  venue: 'Mercedes-Benz Stadium, Atlanta',
  network: 'ABC'
};

const DEMO_PROPS = [
  {
    id: 'gunner-passing-yards',
    player: 'Gunner Stockton',
    prop: 'Passing Yards',
    market: 242.5,
    fair: 236.5,
    edge: -3.2,
    position: 'QB',
    team: 'UGA',
    confidence: 89
  },
  {
    id: 'gunner-rushing-yards',
    player: 'Gunner Stockton',
    prop: 'Rushing Yards',
    market: 22.5,
    fair: 24.8,
    edge: 2.1,
    position: 'QB',
    team: 'UGA',
    confidence: 87
  },
  {
    id: 'gunner-passing-tds',
    player: 'Gunner Stockton',
    prop: 'Passing Touchdowns',
    market: 2.5,
    fair: 2.65,
    edge: 1.8,
    position: 'QB',
    team: 'UGA',
    confidence: 91
  }
];

interface PropRowProps {
  prop: typeof DEMO_PROPS[0];
  onClick: () => void;
  isSelected?: boolean;
}

function PropRow({ prop, onClick, isSelected }: PropRowProps) {
  const isOver = prop.edge > 0;
  const edgeColor = isOver ? 'text-green-600' : 'text-red-600';
  const edgeBg = isOver ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-left">
            <div className="font-semibold text-gray-900">{prop.prop}</div>
            <div className="text-sm text-gray-500">{prop.player}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-lg font-mono font-bold text-gray-900">
              {prop.market}
            </div>
            <div className="text-sm text-gray-500">Market</div>
          </div>
          
          <div className={`px-3 py-1 rounded-full border ${edgeBg}`}>
            <span className={`text-sm font-medium ${edgeColor}`}>
              {prop.edge > 0 ? '+' : ''}{prop.edge.toFixed(1)}% {isOver ? 'OVER' : 'UNDER'}
            </span>
          </div>
          
          <Play className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </button>
  );
}

interface VideoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProp: typeof DEMO_PROPS[0] | null;
}

function VideoDrawer({ isOpen, onClose, selectedProp }: VideoDrawerProps) {
  const [showWhyCard, setShowWhyCard] = useState(false);
  
  useEffect(() => {
    if (isOpen && selectedProp) {
      // Delay showing Why Card for demo effect
      const timer = setTimeout(() => setShowWhyCard(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowWhyCard(false);
    }
  }, [isOpen, selectedProp]);

  if (!isOpen || !selectedProp) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedProp.player} - {selectedProp.prop}
              </h2>
              <p className="text-gray-600">Video Brain Analysis</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Fair vs Market */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-sm text-gray-500">Market Line</div>
              <div className="text-2xl font-mono font-bold text-gray-900">
                {selectedProp.market}
              </div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600">Fair Value</div>
              <div className="text-2xl font-mono font-bold text-blue-600">
                {selectedProp.fair}
              </div>
            </div>
            <div className="text-center p-3 bg-gradient-to-r from-red-50 to-green-50 rounded-lg border">
              <div className="text-sm text-gray-500">Edge</div>
              <div className={`text-2xl font-bold ${selectedProp.edge > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedProp.edge > 0 ? '+' : ''}{selectedProp.edge.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Video Clips */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Video Evidence</h3>
              <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Powered by TwelveLabs
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <ClipsGrid 
                playerId="gunner-stockton"
              />
            </div>
          </div>

          {/* Why Card */}
          {showWhyCard && (
            <div className="animate-fade-in">
              <WhyCard
                marketLine={selectedProp.market}
                fairLine={selectedProp.fair}
                edge={selectedProp.edge}
                propType={selectedProp.prop.toLowerCase().includes('passing') ? 'passing_yards' : 'rushing_yards'}
                playerName={selectedProp.player}
                factors={{
                  form: 'good',
                  opponent: 'elite',
                  pace: 'moderate'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [showPropBoard, setShowPropBoard] = useState(false);
  const [selectedProp, setSelectedProp] = useState<typeof DEMO_PROPS[0] | null>(null);
  const search = useSearch();

  // Initialize performance tracking
  useEffect(() => {
    preloadResources();
    trackWebVitals();
  }, []);

  // Demo flow: Hero → Prop Board → Video Drawer
  const handleOpenPropBoard = () => {
    setShowPropBoard(true);
  };

  const handleSelectProp = (prop: typeof DEMO_PROPS[0]) => {
    setSelectedProp(prop);
  };

  const handleCloseDrawer = () => {
    setSelectedProp(null);
  };

  const handleSearchSelect = (result: any) => {
    console.log('Search selected:', result);
    // Handle search result selection
  };

  if (!showPropBoard) {
    return (
      <>
        <MatchupHero
          homeTeam={DEMO_GAME.homeTeam}
          awayTeam={DEMO_GAME.awayTeam}
          gameTime={DEMO_GAME.gameTime}
          venue={DEMO_GAME.venue}
          network={DEMO_GAME.network}
          onOpenPropBoard={handleOpenPropBoard}
        />
        
        <SearchModal
          isOpen={search.isOpen}
          onClose={search.close}
          onSelect={handleSearchSelect}
        />
        
        {/* Floating Search Button */}
        <button
          onClick={search.open}
          className="fixed top-6 right-6 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 p-3 rounded-2xl shadow-2xl transition-all duration-200 hover:scale-105 z-40"
          title="Search (⌘K)"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <div className="hidden sm:flex items-center space-x-1 text-sm text-gray-500">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {DEMO_GAME.awayTeam.shortName} vs {DEMO_GAME.homeTeam.shortName}
              </h1>
              <p className="text-gray-600">Player Props • Live Analysis</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={search.open}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
                <div className="hidden sm:flex items-center space-x-1 text-sm text-gray-500">
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              </button>
              
              <button
                onClick={() => setShowPropBoard(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Game
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prop Board */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Gunner Stockton Props
          </h2>
          <p className="text-gray-600">
            Tap any prop to see video evidence and fair line analysis
          </p>
        </div>

        <div className="space-y-3">
          {DEMO_PROPS.map((prop) => (
            <PropRow
              key={prop.id}
              prop={prop}
              onClick={() => handleSelectProp(prop)}
              isSelected={selectedProp?.id === prop.id}
            />
          ))}
        </div>

        {/* Performance Stats */}
        <div className="mt-12 p-6 bg-white rounded-2xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Demo Performance
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">&lt; 30s</div>
              <div className="text-sm text-gray-500">Decision Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">+25%</div>
              <div className="text-sm text-gray-500">Confidence Boost</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">89%</div>
              <div className="text-sm text-gray-500">AI Confidence</div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Drawer */}
      <VideoDrawer
        isOpen={!!selectedProp}
        onClose={handleCloseDrawer}
        selectedProp={selectedProp}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={search.isOpen}
        onClose={search.close}
        onSelect={handleSearchSelect}
      />
    </div>
  );
}

// Add CSS animations
const styles = `
  @keyframes slide-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  
  .animate-fade-in {
    animation: fade-in 0.4s ease-out;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}