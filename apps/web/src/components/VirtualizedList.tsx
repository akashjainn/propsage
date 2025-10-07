"use client";

import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  maxHeight?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 120,
  overscan = 5,
  className = '',
  maxHeight = '600px',
  keyExtractor = (_, index) => index.toString()
}: VirtualizedListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();
  
  // Memoize the rendered items to prevent unnecessary re-renders
  const renderedItems = useMemo(() => {
    return virtualItems.map((virtualItem) => {
      const item = items[virtualItem.index];
      const key = keyExtractor(item, virtualItem.index);
      
      return (
        <div
          key={key}
          data-index={virtualItem.index}
          ref={virtualizer.measureElement}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          {renderItem(item, virtualItem.index)}
        </div>
      );
    });
  }, [virtualItems, items, renderItem, keyExtractor, virtualizer]);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <p className="text-gray-500">No items to display</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ maxHeight, contain: 'strict' }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {renderedItems}
      </div>
    </div>
  );
}

// Performance-optimized props grid using virtualization
interface VirtualizedPropsGridProps {
  props: any[];
  onPropClick: (prop: any) => void;
  selectedPropId?: string;
  itemHeight?: number;
}

export function VirtualizedPropsGrid({ 
  props, 
  onPropClick, 
  selectedPropId, 
  itemHeight = 140 
}: VirtualizedPropsGridProps) {
  const renderProp = React.useCallback((prop: any, index: number) => {
    const isSelected = selectedPropId === `${prop.playerId}-${prop.propType}`;
    
    return (
      <div className="p-2">
        <button
          onClick={() => onPropClick(prop)}
          className={`
            w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
            ${isSelected 
              ? 'border-blue-500 bg-blue-50 shadow-lg' 
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{prop.player}</h3>
            <span className={`text-sm font-bold ${prop.edge > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {prop.edge > 0 ? '+' : ''}{prop.edge.toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-gray-600">{prop.propType} • {prop.team}</p>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Market: {prop.marketLine}</span>
            <span>Fair: {prop.fairLine}</span>
          </div>
        </button>
      </div>
    );
  }, [onPropClick, selectedPropId]);

  return (
    <VirtualizedList
      items={props}
      renderItem={renderProp}
      estimateSize={itemHeight}
      keyExtractor={(prop) => `${prop.playerId}-${prop.propType}`}
      className="border border-gray-200 rounded-lg"
      maxHeight="800px"
    />
  );
}

export default VirtualizedList;