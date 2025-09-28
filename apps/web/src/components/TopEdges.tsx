"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Play } from 'lucide-react';

interface TopEdge {
  player: string;
  propType: string;
  edge: number;
  confidence: number;
  team: string;
  gameId: string;
}
interface TopEdgesProps {
  onSelect?: (payload: { gameId: string; player?: string; propType?: string }) => void;
}

const TopEdges: React.FC<TopEdgesProps> = ({ onSelect }) => {
  // Start with data immediately visible for debugging
  const [topEdges, setTopEdges] = useState<TopEdge[]>([
    {
      player: 'Haynes King',
      propType: 'Passing Touchdowns',
      edge: 12.5,
      confidence: 91,
      team: 'Georgia Tech',
      gameId: 'gt-wake'
    },
    {
      player: 'Luke Altmyer',
      propType: 'Passing Yards',
      edge: 11.8,
      confidence: 94,
      team: 'Illinois',
      gameId: 'illinois-usc'
    },
    {
      player: 'Kaden Feagin',
      propType: 'Receiving Yards',
      edge: 6.2,
      confidence: 82,
      team: 'Illinois',
      gameId: 'illinois-usc'
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate fetching top edges across all games
    const fetchTopEdges = async () => {
      try {
        console.log('TopEdges: Starting to fetch data...');
        // In a real app, this would aggregate across all games
        const mockTopEdges: TopEdge[] = [
          {
            player: 'Haynes King',
            propType: 'Passing Touchdowns',
            edge: 12.5,
            confidence: 91,
            team: 'Georgia Tech',
            gameId: 'gt-wake'
          },
          {
            player: 'Luke Altmyer',
            propType: 'Passing Yards',
            edge: 11.8,
            confidence: 94,
            team: 'Illinois',
            gameId: 'illinois-usc'
          },
          {
            player: 'Kaden Feagin',
            propType: 'Receiving Yards',
            edge: 6.2,
            confidence: 82,
            team: 'Illinois',
            gameId: 'illinois-usc'
          }
        ];
        
        console.log('TopEdges: Setting mock data:', mockTopEdges);
        setTopEdges(mockTopEdges);
      } catch (error) {
        console.error('Error fetching top edges:', error);
      } finally {
        console.log('TopEdges: Setting loading to false');
        setLoading(false);
      }
    };

    fetchTopEdges();
  }, []);

  console.log('TopEdges render - loading:', loading, 'topEdges count:', topEdges.length);

  if (loading) {
    console.log('TopEdges: Rendering loading state');
    return (
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Zap className="w-6 h-6 text-white mr-2" />
          <h2 className="text-xl font-bold text-white">Today's Top Edges</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white bg-opacity-20 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-white bg-opacity-30 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white bg-opacity-30 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  console.log('TopEdges: Rendering main content with', topEdges.length, 'edges');
  
  return (
    <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Zap className="w-6 h-6 mr-2" />
          <h2 className="text-xl font-bold">Today's Top Edges</h2>
        </div>
        <div className="text-sm opacity-80">Where the market is wrong</div>
      </div>
      
      <div className="space-y-4">
        {topEdges.map((edge, index) => (
          <div
            key={`${edge.player}-${edge.propType}`}
            onClick={() => onSelect?.({ gameId: edge.gameId, player: edge.player, propType: edge.propType })}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 hover:bg-opacity-20 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{edge.player}</div>
                    <div className="text-sm opacity-80">{edge.team} • {edge.propType}</div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center justify-end mb-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-2xl font-bold">+{edge.edge.toFixed(1)}%</span>
                </div>
                <div className="text-xs opacity-80">{edge.confidence}% confidence</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white border-opacity-20">
              <div className="text-xs opacity-80">
                Market mispricing detected
              </div>
              <div className="flex items-center text-sm group-hover:translate-x-1 transition-transform duration-200">
                <Play className="w-3 h-3 mr-1" />
                View Analysis
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-white border-opacity-20">
        <div className="text-center text-sm opacity-80">
          🎬 Backed by game film analysis • 📊 Real-time odds tracking
        </div>
      </div>
    </div>
  );
};

export default TopEdges;