"use client"
import React from 'react'

export function SearchBar({ onSearch }: { onSearch: (sport:string, q:string)=>void }) {
  const [sport, setSport] = React.useState<'NBA'|'NFL'|'MLB'>('NBA');
  const [q, setQ] = React.useState('');
  return (
    <div className="flex flex-wrap gap-3 w-full">
      <div className="relative">
        <select
          value={sport}
          onChange={e=>setSport(e.target.value as any)}
          className="appearance-none rounded-full bg-slate-800 text-slate-100 border border-slate-600 pl-4 pr-10 py-2 text-sm"
        >
          <option>NBA</option><option>NFL</option><option>MLB</option>
        </select>
        <span className="pointer-events-none absolute top-1/2 -right-3 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 ring-1 ring-cyan-600/40 text-[10px] text-slate-300">▼</span>
      </div>

      <form
        onSubmit={(e)=>{e.preventDefault(); onSearch(sport, q.trim());}}
        className="flex-1 min-w-[260px] flex gap-2"
      >
        <input
          value={q} onChange={e=>setQ(e.target.value)}
          placeholder='Search player…'
          className="w-full rounded-xl bg-slate-800 text-slate-100 placeholder-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 px-4 py-2 text-sm"
        />
        <button className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 font-medium text-sm">Search</button>
      </form>
    </div>
  );
}
