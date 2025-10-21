export async function fetchNflGames(season: number, week: number) {
  const res = await fetch(`/api/nfl/games?season=${season}&week=${week}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed fetching NFL games')
  return res.json()
}

export async function fetchNflProps(gameId: string, demo?: boolean) {
  const url = new URL(`/api/nfl/props`, window.location.origin)
  url.searchParams.set('gameId', gameId)
  if (demo) url.searchParams.set('demo', '1')
  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed fetching NFL props')
  return res.json()
}
