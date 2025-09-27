"use client";
import React, { useState } from 'react';
import { CTAButton, Card, Badge } from '@/ui';

interface HeroSearchProps {
  defaultScope?: 'CFB' | 'NFL' | 'NBA' | 'MLB';
  placeholder?: string;
  onSearch?: (scope: string, query: string) => void;
  ctaLabel?: string;
  footer?: React.ReactNode;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  defaultScope = 'CFB',
  placeholder = 'Search a player…',
  onSearch,
  ctaLabel = 'Search',
  footer
}) => {
  const [scope, setScope] = useState<string>(defaultScope);
  const [q, setQ] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    onSearch?.(scope, q.trim());
  };

  return (
    <Card className="p-6 bg-white/5 backdrop-blur border-white/10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="flex items-center gap-2">
            <select
              value={scope}
              onChange={e => setScope(e.target.value)}
              className="rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              aria-label="Sport scope"
            >
              {['CFB','NFL','NBA','MLB'].map(s=> <option key={s}>{s}</option>)}
            </select>
          </div>
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 placeholder:text-white/40"
            aria-label="Player search input"
          />
          <CTAButton type="submit" className="md:self-stretch">{ctaLabel}</CTAButton>
        </div>
        {footer ?? (
          <p className="text-xs text-white/60 leading-relaxed">
            Search a college football player to view <span className="text-emerald-300">market vs fair line edges</span> and watch <span className="text-amber-300">video moments</span>.
          </p>
        )}
      </form>
    </Card>
  );
};

export default HeroSearch;