"use client"
import React from 'react'

export interface Clip { title:string; start:number; end:number; videoUrl:string; snippet?:string }

export function VideoPanel({ onQuery, clips, loading }:{ onQuery:(q:string)=>void; clips:Clip[]; loading:boolean }) {
  const [q, setQ] = React.useState('')
  return (
    <aside className="rounded-2xl bg-slate-900/40 ring-1 ring-white/10 p-4 flex flex-col h-full">
      <div className="flex gap-2">
        <input
          value={q} onChange={e=>setQ(e.target.value)}
          placeholder='e.g., "Anthony Edwards injury", "clutch threes"'
          className="w-full rounded-xl bg-slate-800 text-slate-100 placeholder-slate-400 border border-slate-600 focus:ring-2 focus:ring-violet-500 px-3 py-2 text-sm"
        />
        <button onClick={()=>onQuery(q)} className="rounded-xl bg-violet-600 hover:bg-violet-500 px-3 text-sm font-medium">Go</button>
      </div>
      <div className="mt-4 space-y-3 overflow-y-auto">
        {loading ? <div className="text-slate-400 text-sm">Searching…</div> :
          clips.length===0 ? <div className="text-slate-500 text-sm">No clips yet.</div> :
          clips.map((c,i)=>(
            <div key={i} className="rounded-xl bg-slate-800/60 p-3">
              <div className="text-slate-200 font-medium text-sm leading-tight">{c.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{fmt(c.start)}–{fmt(c.end)}</div>
              {c.snippet && <div className="mt-2 text-slate-300 text-xs leading-snug">{c.snippet}</div>}
              <button onClick={()=>seekTo(c.videoUrl, c.start)} className="mt-2 text-violet-400 text-xs font-medium hover:underline">Play from start</button>
            </div>
          ))
        }
      </div>
    </aside>
  )
}
function fmt(s:number){const m=Math.floor(s/60);const ss=String(Math.floor(s%60)).padStart(2,'0');return `${m}:${ss}`;}
function seekTo(url:string, start:number){ if (typeof window !== 'undefined') window.open(`${url}#t=${Math.floor(start)}`, '_blank'); }
