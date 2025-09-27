"use client"
import React from 'react'

export function LineCompareCard({
  marketName, bookName, marketLine, fairLine, edgePct
}: { marketName:string; bookName:string; marketLine:number; fairLine:number; edgePct:number }) {
  const edgeSign = edgePct >= 0 ? '+' : '';
  return (
    <div className="rounded-2xl bg-slate-900/40 ring-1 ring-white/10 p-4 flex flex-col">
      <div className="text-slate-300 text-xs font-medium tracking-wide">{marketName} • {bookName}</div>
      <div className="mt-3 flex items-end gap-6">
        <div>
          <div className="text-[11px] uppercase text-slate-500 mb-0.5">Market</div>
          <div className="text-3xl font-semibold tabular-nums lining-nums tracking-tight leading-none">{marketLine}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase text-slate-500 mb-0.5">Fair</div>
          <div className="text-3xl font-semibold tabular-nums lining-nums tracking-tight leading-none">{fairLine.toFixed(2)}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[11px] uppercase text-slate-500 mb-0.5">Edge</div>
          <div className={`text-3xl font-semibold tabular-nums lining-nums tracking-tight leading-none ${edgePct>=0?'text-emerald-400':'text-rose-400'}`}>{edgeSign}{edgePct.toFixed(1)}%</div>
        </div>
      </div>
      <div className="mt-4 h-16 rounded-md bg-slate-800/60" />
    </div>
  );
}
