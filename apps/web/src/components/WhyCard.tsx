"use client";

import React from 'react';
import { TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';

interface WhyCardProps {
  propId: string;
  marketLine: number;
  fairLine: number;
  edgePct: number; // signed
  bullets?: string[];
  isLoading?: boolean;
  propType?: 'passing_yards' | 'rushing_yards' | 'receiving_yards' | 'touchdowns' | string;
  playerName?: string;
  factors?: {
    form: 'good' | 'average' | 'poor';
    opponent: 'elite' | 'good' | 'average' | 'weak';
    pace: 'fast' | 'moderate' | 'slow';
    weather?: 'clear' | 'windy' | 'rain';
  };
}


export default function WhyCard({
  propId,
  marketLine,
  fairLine,
  edgePct,
  bullets,
  isLoading = false,
  propType = 'passing_yards',
  playerName = 'Player',
  factors = { form: 'good', opponent: 'elite', pace: 'moderate' }
}: WhyCardProps) {
  const edgeDirection = edgePct > 0 ? 'OVER' : edgePct < 0 ? 'UNDER' : '';
  const edgeColor = edgePct > 0 ? 'text-green-600' : edgePct < 0 ? 'text-red-600' : 'text-gray-600';
  const edgeBgColor = edgePct > 0 ? 'bg-green-50 border-green-200' : edgePct < 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200';
  const animatedAbs = useCountUp(Math.abs(edgePct));

  const getFactorIcon = (factor: string, value: string) => {
    switch (factor) {
      case 'form':
        return value === 'good' ? <TrendingUp className="w-4 h-4 text-green-500" /> : 
               value === 'poor' ? <TrendingDown className="w-4 h-4 text-red-500" /> :
               <Target className="w-4 h-4 text-yellow-500" />;
      case 'pace':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const getFactorColor = (factor: string, value: string) => {
    if (factor === 'form') {
      return value === 'good' ? 'text-green-700' : 
             value === 'poor' ? 'text-red-700' : 'text-yellow-700';
    }
    if (factor === 'opponent') {
      return value === 'elite' ? 'text-red-700' : 
             value === 'weak' ? 'text-green-700' : 'text-gray-700';
    }
    return 'text-gray-700';
  };

  const generateWhyText = () => {
    const reasons: string[] = [];
    if (factors.form === 'good') reasons.push(`${playerName} strong recent form`);
    else if (factors.form === 'poor') reasons.push(`${playerName} recent dip in production`);
    if (factors.opponent === 'elite') reasons.push('Challenging elite defense context');
    else if (factors.opponent === 'weak') reasons.push('Favorable defensive matchup');
    if (factors.pace === 'fast') reasons.push('High pace → more play volume');
    else if (factors.pace === 'slow') reasons.push('Lower pace may cap opportunities');
    if (factors.weather === 'windy' && propType === 'passing_yards') reasons.push('Wind may suppress downfield efficiency');
    return reasons.slice(0, 3);
  };
  const displayBullets = bullets && bullets.length ? bullets : generateWhyText();
  const showSkeleton = isLoading || (!bullets && !displayBullets.length);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm" aria-busy={showSkeleton} aria-live="polite">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Why Card</h3>
        <div className={`px-3 py-1 rounded-full border ${edgeBgColor}`} aria-label={`${edgePct > 0 ? 'plus ' : edgePct < 0 ? 'minus ' : ''}${Math.abs(edgePct).toFixed(1)} percent ${edgeDirection.toLowerCase()}`}>
          <span className={`text-sm font-medium ${edgeColor} font-mono tabular-nums`}>
            {edgePct > 0 ? '+' : edgePct < 0 ? '' : ''}{animatedAbs.toFixed(1)}% {edgeDirection}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Market Line</span>
          <span className="text-lg font-mono font-semibold text-gray-900">{marketLine}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Fair Value</span>
          <span className="text-lg font-mono font-semibold text-blue-600">{fairLine.toFixed(1)}</span>
        </div>
        <div className="relative">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${edgePct > 0 ? 'bg-green-400' : edgePct < 0 ? 'bg-red-400' : 'bg-gray-400'}`}
              style={{
                width: `${Math.min(Math.abs(edgePct) * 10, 100)}%`,
                marginLeft: edgePct > 0 ? '50%' : 'auto',
                marginRight: edgePct > 0 ? 'auto' : '50%'
              }}
            />
          </div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-px h-2 bg-gray-400" />
        </div>
      </div>

      {/* Reasoning Factors */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Key Factors</h4>
        <div className="space-y-2">
          {Object.entries(factors).map(([factor, value]) => (
            <div key={factor} className="flex items-center space-x-3">
              {getFactorIcon(factor, value)}
              <span className="text-sm text-gray-600 capitalize">
                {factor.replace('_', ' ')}:
              </span>
              <span className={`text-sm font-medium capitalize ${getFactorColor(factor, value)}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

  {/* Analysis Bullets */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Analysis</h4>
        {showSkeleton ? (
          <div className="space-y-2" role="status">
            {[70,62,54].map((w,i)=>(
              <div key={i} className="h-3 rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" style={{width:`${w}%`}} />
            ))}
          </div>
        ) : (
          <ul className="space-y-1" role="list">
            {displayBullets.map((reason, index) => (
              <li
                role="listitem"
                key={index}
                className="flex items-start space-x-2 opacity-0 animate-fade-in-bullet"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">{reason}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

  {/* Confidence Level */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Model Confidence</span>
          <div className="flex items-center space-x-2">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-700"
                style={{ width: `${85 + Math.abs(edgePct) * 2}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700">
              {Math.round(85 + Math.abs(edgePct) * 2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}