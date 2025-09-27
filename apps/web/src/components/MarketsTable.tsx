"use client"
import React from 'react'

export interface MarketRow { book:string; market:string; marketLine:number|null; fairLine:number; edgePct:number; }

export function MarketsTable({ rows, onSelect }:{ rows: MarketRow[]; onSelect?:(row:MarketRow)=>void }) {
  return (
    <div className="rounded-2xl bg-slate-900/40 ring-1 ring-white/10 overflow-hidden">
      <div className="grid grid-cols-5 gap-3 px-4 py-2 text-[11px] uppercase text-slate-400 tracking-wide">
        <div className="col-span-2">Book / Market</div>
        <div>Line</div>
        <div>Fair</div>
        <div className="text-right">Edge</div>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r,i)=>(
          <button key={i} onClick={()=>onSelect?.(r)} className="grid grid-cols-5 items-center w-full text-left px-4 py-3 hover:bg-slate-900/30 focus:outline-none">
            <div className="col-span-2 text-slate-200 flex flex-col"><span className="font-medium text-sm leading-none">{r.book}</span><span className="text-[11px] text-slate-400 mt-1">{r.market}</span></div>
            <div className="tabular-nums lining-nums tracking-tight leading-none text-sm">{r.marketLine ?? '—'}</div>
            <div className="tabular-nums lining-nums tracking-tight leading-none text-sm text-slate-300">{r.fairLine.toFixed(2)}</div>
            <div className={`text-right tabular-nums lining-nums tracking-tight leading-none text-sm ${r.edgePct>=0?'text-emerald-400':'text-rose-400'}`}>{r.edgePct>=0?'+':''}{r.edgePct.toFixed(1)}%</div>
          </button>
        ))}
      </div>
    </div>
  )
}
