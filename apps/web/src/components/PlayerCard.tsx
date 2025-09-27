"use client"
import React, { useEffect, useState } from 'react'
import { useMC } from '@/hooks/useMC'
import { webConfig } from '@/lib/config'
import { apiUrl } from '@/lib/api'

interface PlayerProp { playerId: string; market: string; line: number }
interface FairlineResp { fair_line: number; edge: number; conf_low: number; conf_high: number; mu: number; sigma: number }

interface PlayerCardProps { selection: PlayerProp | null }

export function PlayerCard({ selection }: PlayerCardProps) {
  const [serverFair, setServerFair] = useState<FairlineResp | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mcInputs = selection && serverFair ? { mu: serverFair.mu, sigma: serverFair.sigma, marketLine: selection.line, simulations: 50000 } : null
  const { result: mcResult, latencyMs } = useMC(mcInputs)

  useEffect(() => {
    if (!selection) return
  const sel = selection // non-null after guard
  let cancelled = false
    async function run() {
      setLoading(true); setError(null)
      try {
  const payload = { player_id: sel.playerId, market: sel.market, line: sel.line }
  const r = await fetch(apiUrl('/fairline'), { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
        if (!r.ok) throw new Error('fail')
        const data = await r.json()
        if (!cancelled) setServerFair(data)
      } catch (e:any) { if (!cancelled) setError('Failed to fetch fair line') }
      finally { if (!cancelled) setLoading(false) }
    }
    run()
    return () => { cancelled = true }
  }, [selection])

  if (!selection) return <div className="glass p-4 rounded-xl text-sm text-gray-400">Select a player...</div>

  return (
    <div className="glass p-4 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-lg">{selection.playerId} — {selection.market}</h3>
        {webConfig.demoMode && <span className="text-xs px-2 py-1 rounded bg-blue-600/30 text-blue-300">Demo</span>}
      </div>
      {loading && <div className="text-xs text-gray-400 animate-pulse">Computing...</div>}
      {error && <div className="text-xs text-red-400">{error}</div>}
      {serverFair && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Metric label="Market Line" value={selection.line.toFixed(2)} />
          <Metric label="Server Fair" value={serverFair.fair_line.toFixed(2)} />
          <Metric label="Edge %" value={(serverFair.edge*100).toFixed(2)} />
          <Metric label="CI 16–84" value={`${serverFair.conf_low.toFixed(1)} – ${serverFair.conf_high.toFixed(1)}`} />
        </div>
      )}
      {mcResult && (
        <div className="pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-400">Worker Fair: <span className="text-white">{mcResult.fair_line.toFixed(2)}</span> | Edge {(mcResult.edge*100).toFixed(2)}% | CI {mcResult.conf_low.toFixed(1)}–{mcResult.conf_high.toFixed(1)} | p&gt;line {(mcResult.p_over*100).toFixed(1)}% | {latencyMs?.toFixed(0)} ms</p>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800/60 rounded p-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-white font-semibold text-sm">{value}</div>
    </div>
  )
}
