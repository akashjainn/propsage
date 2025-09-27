'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';

interface WhyCardProps {
  marketLine: number;
  fairLine: number;
  edge: number;
  propType: 'passing_yards' | 'rushing_yards' | 'receiving_yards' | 'touchdowns';
  playerName: string;
  factors?: {
    form: 'good' | 'average' | 'poor';
    opponent: 'elite' | 'good' | 'average' | 'weak';
    pace: 'fast' | 'moderate' | 'slow';
    weather?: 'clear' | 'windy' | 'rain';
  };
}

export default function WhyCard({ 
  marketLine, 
  fairLine, 
  edge, 
  propType, 
  playerName,
  factors = { form: 'good', opponent: 'elite', pace: 'moderate' }
}: WhyCardProps) {
  const isOver = edge > 0;
  const edgeDirection = isOver ? 'OVER' : 'UNDER';
  const edgeColor = isOver ? 'text-green-600' : 'text-red-600';
  const edgeBgColor = isOver ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

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
    const propName = propType.replace('_', ' ');
    
    // Template-based reasoning
    const reasons = [];
    
    if (factors.form === 'good') {
      reasons.push(`${playerName} showing strong recent form`);
    } else if (factors.form === 'poor') {
      reasons.push(`${playerName} struggling in recent games`);
    }

    if (factors.opponent === 'elite') {
      reasons.push(`facing elite-ranked defense`);
    } else if (factors.opponent === 'weak') {
      reasons.push(`favorable matchup vs weak defense`);
    }

    if (factors.pace === 'fast') {
      reasons.push(`high-pace game environment`);
    } else if (factors.pace === 'slow') {
      reasons.push(`expected low-pace, fewer opportunities`);
    }

    if (factors.weather === 'windy' && propType === 'passing_yards') {
      reasons.push(`windy conditions may limit passing`);
    }

    return reasons;
  };

  const whyReasons = generateWhyText();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Why Card</h3>
        <div className={`px-3 py-1 rounded-full border ${edgeBgColor}`}>
          <span className={`text-sm font-medium ${edgeColor}`}>
            {Math.abs(edge).toFixed(1)}% {edgeDirection}
          </span>
        </div>
      </div>

      {/* Fair vs Market */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Market Line</span>
          <span className="text-lg font-mono font-semibold text-gray-900">
            {marketLine}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Fair Value</span>
          <span className="text-lg font-mono font-semibold text-blue-600">
            {fairLine.toFixed(1)}
          </span>
        </div>

        {/* Visual Edge Indicator */}
        <div className="relative">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isOver ? 'bg-green-400' : 'bg-red-400'
              }`}
              style={{ 
                width: `${Math.min(Math.abs(edge) * 10, 100)}%`,
                marginLeft: isOver ? '50%' : 'auto',
                marginRight: isOver ? 'auto' : '50%'
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

      {/* Plain English Why */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Analysis</h4>
        <div className="space-y-1">
          {whyReasons.map((reason, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-gray-600">{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Level */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Model Confidence</span>
          <div className="flex items-center space-x-2">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-700"
                style={{ width: `${85 + Math.abs(edge) * 2}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700">
              {Math.round(85 + Math.abs(edge) * 2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}