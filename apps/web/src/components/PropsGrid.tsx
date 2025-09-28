"use client";

import React from 'react';
import { TrendingUp, TrendingDown, User } from 'lucide-react';

interface PropCard {
  player: string;
  playerId: string;
  propType: string;
  marketLine: number;
  fairLine: number;
  edge: number;
  confidence: number;
  position: string;
  team: string;
}

interface PropsGridProps {
  props: PropCard[];
  onPropClick: (prop: PropCard) => void;
  selectedPropId?: string;
}

const PropsGrid: React.FC<PropsGridProps> = ({ props, onPropClick, selectedPropId }) => {
  if (props.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl bg-gray-50">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No props available</h3>
          <p className="text-gray-500">Props data is being analyzed</p>
        </div>
      </div>
    );
  }

  const formatPropType = (propType: string) => {
    return propType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {props.map((prop, index) => {
        const isPositiveEdge = prop.edge > 0;
        const edgeColor = isPositiveEdge ? 'text-green-600' : 'text-red-600';
        const edgeBg = isPositiveEdge ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
        const isSelected = selectedPropId === `${prop.playerId}-${prop.propType}`;
        
        return (
          <button
            key={`${prop.playerId}-${prop.propType}`}
            onClick={() => onPropClick(prop)}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg text-left
              ${isSelected 
                ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]' 
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            {/* Player Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{prop.player}</h3>
                <p className="text-sm text-gray-500">{prop.position} • {prop.team}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Confidence</div>
                <div className="text-sm font-medium text-gray-700">{prop.confidence}%</div>
              </div>
            </div>

            {/* Prop Details */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">{formatPropType(prop.propType)}</div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500">Market:</span>
                  <span className="ml-1 font-medium">{prop.marketLine}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Fair:</span>
                  <span className="ml-1 font-medium">{prop.fairLine}</span>
                </div>
              </div>
            </div>

            {/* Edge Display */}
            <div className={`flex items-center justify-center py-3 px-4 rounded-lg border ${edgeBg}`}>
              {isPositiveEdge ? (
                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
              )}
              <span className={`font-bold text-lg ${edgeColor}`}>
                {isPositiveEdge ? '+' : ''}{prop.edge.toFixed(1)}%
              </span>
              <span className="ml-2 text-xs text-gray-600">edge</span>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PropsGrid;