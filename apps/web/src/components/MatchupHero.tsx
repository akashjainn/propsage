'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Users, MapPin, Tv } from 'lucide-react';

interface MatchupHeroProps {
  homeTeam: {
    name: string;
    shortName: string;
    logo: string;
    color: string;
    record: string;
    ranking?: number;
  };
  awayTeam: {
    name: string;
    shortName: string;
    logo: string;
    color: string;
    record: string;
    ranking?: number;
  };
  gameTime: string; // ISO string
  venue: string;
  network?: string;
  onOpenPropBoard: () => void;
}

export default function MatchupHero({
  homeTeam,
  awayTeam,
  gameTime,
  venue,
  network,
  onOpenPropBoard
}: MatchupHeroProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const gameDate = new Date(gameTime).getTime();
      const difference = gameDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setIsLive(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [gameTime]);

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-7xl font-black text-white mb-4 tracking-tight">
            Odds. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">With evidence.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            See the video evidence and AI reasoning behind every player prop line
          </p>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-center space-x-8 md:space-x-16 mb-12">
          {/* Away Team */}
          <div className="text-center group">
            <div className="relative">
              <div 
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-2xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: awayTeam.color }}
              >
                {awayTeam.shortName}
              </div>
              {awayTeam.ranking && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm font-bold text-black">
                  #{awayTeam.ranking}
                </div>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-4">
              {awayTeam.name}
            </h3>
            <p className="text-slate-400">{awayTeam.record}</p>
          </div>

          {/* VS */}
          <div className="text-4xl md:text-6xl font-black text-slate-500">
            VS
          </div>

          {/* Home Team */}
          <div className="text-center group">
            <div className="relative">
              <div 
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-2xl transition-transform group-hover:scale-105"
                style={{ backgroundColor: homeTeam.color }}
              >
                {homeTeam.shortName}
              </div>
              {homeTeam.ranking && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm font-bold text-black">
                  #{homeTeam.ranking}
                </div>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-4">
              {homeTeam.name}
            </h3>
            <p className="text-slate-400">{homeTeam.record}</p>
          </div>
        </div>

        {/* Game Info */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300 mb-12">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>{venue}</span>
          </div>
          {network && (
            <div className="flex items-center space-x-2">
              <Tv className="w-5 h-5" />
              <span>{network}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>{new Date(gameTime).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}</span>
          </div>
        </div>

        {/* Countdown or Live */}
        {isLive ? (
          <div className="mb-12">
            <div className="inline-flex items-center space-x-3 bg-red-600 text-white px-6 py-3 rounded-full text-xl font-bold animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
              <span>LIVE NOW</span>
            </div>
          </div>
        ) : (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-300 mb-6">Kickoff In</h2>
            <div className="grid grid-cols-4 gap-4 md:gap-8">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Minutes', value: timeLeft.minutes },
                { label: 'Seconds', value: timeLeft.seconds }
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 md:p-6 min-w-[80px] md:min-w-[100px]">
                    <div className="text-3xl md:text-5xl font-mono font-bold text-white tabular-nums">
                      {formatTime(value)}
                    </div>
                    <div className="text-sm md:text-base text-slate-400 mt-2 font-medium">
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onOpenPropBoard}
          className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 md:px-12 rounded-2xl text-xl md:text-2xl transition-all duration-200 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
        >
          <span className="relative z-10 flex items-center space-x-3">
            <Users className="w-6 h-6" />
            <span>Open Prop Board</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
        </button>

        {/* Proof Points */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-slate-400">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">30s</div>
            <div className="text-sm">Decision Time</div>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">+25%</div>
            <div className="text-sm">Confidence Boost</div>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">Real</div>
            <div className="text-sm">Video Evidence</div>
          </div>
        </div>
      </div>
    </div>
  );
}