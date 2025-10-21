export interface PlayerProp {
  sportEventId: string
  nflGameId?: string
  player: { name: string; nflId?: string; ocId?: string; teamAbbr?: string; position?: string }
  market: { key: string; name: string }
  line: number
  book?: { name?: string; lastUpdated?: string }
  odds: { over?: number; under?: number; overAmerican?: string; underAmerican?: string }
  fairLine?: number
  edge?: number
}

function toKey(name: string): string {
  const map: Record<string, string> = {
    'Passing Yards': 'passing_yards',
    'Rushing Yards': 'rushing_yards',
    'Receptions': 'receptions',
    'Receiving Yards': 'receiving_yards',
    'Passing Touchdowns': 'passing_touchdowns',
    'Rushing Touchdowns': 'rushing_touchdowns',
    'Receiving Touchdowns': 'receiving_touchdowns',
  }
  return map[name] || name.toLowerCase().replace(/\s+/g, '_')
}

export function normalizeOcPlayerProps(ocEventId: string, nflGameId: string | undefined, markets: any[]): PlayerProp[] {
  const out: PlayerProp[] = []
  for (const m of markets || []) {
    const marketName = m.name || m.market || 'Unknown'
    const key = toKey(marketName)
    const selections = m.selections || m.outcomes || []
    for (const sel of selections) {
      const fullName = sel?.name || sel?.player_name || 'Unknown'
      // Try to parse a line from handicap or from selection text
      const lineVal = sel?.handicap ?? sel?.line ?? parseFloat((fullName.match(/(-?\d+(?:\.\d+)?)/)?.[0] ?? 'NaN'))
      const over = /over/i.test(sel?.outcome ?? fullName)
      const under = /under/i.test(sel?.outcome ?? fullName)
      const odds = {
        over: over ? sel?.odds : undefined,
        under: under ? sel?.odds : undefined,
        overAmerican: over ? sel?.american_odds : undefined,
        underAmerican: under ? sel?.american_odds : undefined,
      }
      out.push({
        sportEventId: ocEventId,
        nflGameId,
        player: { name: fullName.replace(/Over.*|Under.*/i, '').trim() },
        market: { key, name: marketName },
        line: Number.isFinite(Number(lineVal)) ? Number(lineVal) : NaN,
        odds,
      })
    }
  }
  return out.filter(p => Number.isFinite(p.line))
}
