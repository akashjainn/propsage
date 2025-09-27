"use client";

import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
// Local lightweight player (import fallback) to avoid TS resolution issues
import type { Clip } from './clip.types';
const InlinePlayer: React.FC<{clip: Clip; onEnded?: () => void;}> = ({ clip, onEnded }) => {
  const ref = React.useRef<HTMLVideoElement>(null);
  React.useEffect(()=>{
    const v = ref.current; if(!v) return; v.currentTime = clip.start; v.play().catch(()=>{});
    const t = ()=>{ if(v.currentTime >= clip.end - 0.1){ v.pause(); onEnded?.(); } };
    v.addEventListener('timeupdate', t); return ()=> v.removeEventListener('timeupdate', t);
  },[clip.id]);
  return <video ref={ref} muted playsInline preload="metadata" poster={clip.thumbnail} src={clip.src} className="w-full aspect-video rounded-xl bg-black" />;
};

export interface ClipsGridProps {
  playerId: string;
  propType?: 'Passing Yards' | 'Passing TDs' | 'Rushing Yards' | 'Rushing TDs' | 'Receptions' | 'Receiving Yards' | 'Interceptions';
  isLoading?: boolean;
  clips: Clip[];
  onSelect?: (clip: Clip) => void;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function orderClips(base: Clip[], playerId: string, propType?: ClipsGridProps['propType']): Clip[] {
  const ids = new Set(base.map(c => c.id));
  let priority: string | null = null;
  if (playerId === 'haynes-king') {
    if (propType && propType.includes('Passing') && ids.has('c_king_pass_td')) priority = 'c_king_pass_td';
    else if (propType && propType.includes('Rushing') && ids.has('c_king_rush_td')) priority = 'c_king_rush_td';
  } else if (playerId === 'jamal-haines' && ids.has('c_haines_fumble')) {
    priority = 'c_haines_fumble';
  }
  if (!priority) return base;
  const copy = [...base];
  const idx = copy.findIndex(c => c.id === priority);
  if (idx > 0) {
    const [p] = copy.splice(idx, 1);
    copy.unshift(p);
  }
  return copy;
}

export function ClipsGrid({ playerId, propType, isLoading, clips, onSelect }: ClipsGridProps) {
  const [selected, setSelected] = useState<Clip | null>(null);
  const reduced = prefersReducedMotion();
  const ordered = orderClips(clips, playerId, propType);

  const skeleton = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="status" aria-busy="true" aria-live="polite">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
          <div className="aspect-video bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-3/4 bg-gray-300 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  const handleClick = (clip: Clip) => {
    setSelected(clip);
    onSelect?.(clip);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Video Evidence {isLoading ? '' : `(${ordered.length})`}</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {isLoading ? <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> : <span className="w-2 h-2 rounded-full bg-green-500" />} 
          <span>{isLoading ? 'Indexing stream...' : 'Analysis Complete'}</span>
        </div>
      </div>
      {isLoading ? skeleton : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordered.map((clip, i) => (
            <button
              key={clip.id}
              onClick={() => handleClick(clip)}
              role="button"
              tabIndex={0}
              aria-label={`Play clip ${clip.title}`}
              className={`group relative text-left bg-white rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${selected?.id === clip.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}
              style={!reduced ? { animation: 'fade-in 400ms ease-out', animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' } : undefined}
            >
              <div className="relative aspect-video bg-gray-100">
                <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none';}} />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 to-purple-500/20" />
                <div className="absolute inset-0 flex items-center justify-center opacity-90 group-hover:opacity-100 transition">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center"><Play className="w-5 h-5 text-gray-700 ml-0.5" /></div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">{clip.end - clip.start}s</div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 text-xs rounded font-medium" aria-label={`Match confidence ${Math.round(clip.confidence*100)} percent`}>
                  {Math.round(clip.confidence * 100)}%
                </div>
              </div>
              <div className="p-3 space-y-2">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{clip.title}</h4>
                <div className="flex flex-wrap gap-1">
                  {clip.tags.slice(0,3).map(t => <span key={t} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full" aria-label={`Tag ${t}`}>{t}</span>)}
                  {clip.tags.length > 3 && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full" aria-label={`+${clip.tags.length-3} more tags`}>+{clip.tags.length - 3}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-center">
        <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200 text-xs font-medium text-blue-700">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> <span>Powered by TwelveLabs</span>
        </div>
      </div>
      {selected && (
        <InlinePlayer clip={selected} onEnded={() => {}} />
      )}
    </div>
  );
}

export default ClipsGrid;

