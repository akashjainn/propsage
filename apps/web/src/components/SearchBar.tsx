"use client"
import React from 'react'

export function SearchBar({ onSearch }: { onSearch: (sport:string, q:string)=>void }) {
  const [sport, setSport] = React.useState<'NBA'|'NFL'|'CFB'|'MLB'>('CFB');
  const [q, setQ] = React.useState('');
  return (
    <div className="flex flex-wrap gap-3 w-full">
      <div className="relative inline-block">
        <select
          value={sport}
          onChange={e=>setSport(e.target.value as any)}
          className="appearance-none rounded-full bg-[var(--card)] text-[var(--fg)]
                           border border-white/10 pl-4 pr-10 py-2 text-sm focus:outline-none
                           focus:ring-2 focus:ring-[var(--iris)]"
        >
          <option value="NBA">NBA</option>
          <option value="NFL">NFL</option>
          <option value="CFB">CFB</option>
          <option value="MLB">MLB</option>
        </select>
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2
                               text-[var(--fg-dim)] text-sm">▾</span>
      </div>

      <form
        onSubmit={(e)=>{e.preventDefault(); onSearch(sport, q.trim());}}
        className="flex-1 min-w-[280px] flex gap-3"
      >
        <input
          value={q} onChange={e=>setQ(e.target.value)}
          placeholder='Search a player…'
          className="w-full rounded-xl bg-[var(--card)] text-[var(--fg)]
                           placeholder-[var(--muted)] border border-white/10 px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--iris)]"
        />
        <button
          className="rounded-xl px-5 py-3 font-medium text-sm
                           bg-gradient-to-tr from-[var(--iris)] to-[#8b76ff]
                           shadow-[0_10px_30px_rgba(108,92,231,.45)]
                           hover:brightness-110 transition"
        >
          Search
        </button>
      </form>
    </div>
  );
}
