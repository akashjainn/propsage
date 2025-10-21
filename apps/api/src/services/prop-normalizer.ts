export interface PlayerProp {
  sportEventId: string
  nflGameId: string
  player: { name: string; nflId?: string; ocId?: string; teamAbbr: string; position?: string }
  market: { key: string; name: string }
  line: number
  book: { name: string; lastUpdated: string }
  odds: { over?: number; under?: number }
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

export function normalizeOcPlayerProps(oc: any, ocSportEventId: string, nflGameId: string): PlayerProp[] {
  const props: PlayerProp[] = []
  const markets = oc?.markets || oc?.player_markets || []
  for (const m of markets) {
    const marketName = m.name || m.market || 'Unknown'
    const key = toKey(marketName)
    const selections = m.selections || m.outcomes || []
    for (const sel of selections) {
      const competitor = sel?.competitor || sel?.player || {}
      const name = competitor?.name || competitor?.full_name || 'Unknown'
      const teamAbbr = competitor?.team_abbr || competitor?.team?.abbreviation || competitor?.team || ''
      const line = Number(sel?.line ?? sel?.handicap ?? sel?.points)
      const book = { name: sel?.book?.name || sel?.book || 'consensus', lastUpdated: sel?.last_updated || sel?.updated_at || new Date().toISOString() }
      const odds = {
        over: sel?.over_odds ?? sel?.over?.odds ?? sel?.price_over,
        under: sel?.under_odds ?? sel?.under?.odds ?? sel?.price_under,
      }
      props.push({
        sportEventId: ocSportEventId,
        nflGameId,
        player: { name, teamAbbr },
        market: { key, name: marketName },
        line: isFinite(line) ? line : NaN,
        book,
        odds,
      })
    }
  }
  return props.filter(p => isFinite(p.line))
}
