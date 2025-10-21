import useSWR from 'swr'
import { fetchNflGames, fetchNflProps } from '../lib/api/nfl'

export function useNflGames(season: number, week: number) {
  return useSWR(['nfl/games', season, week], () => fetchNflGames(season, week))
}

export function useNflProps(gameId?: string, demo?: boolean) {
  return useSWR(gameId ? ['nfl/props', gameId, demo] : null, () => fetchNflProps(gameId!, demo))
}
