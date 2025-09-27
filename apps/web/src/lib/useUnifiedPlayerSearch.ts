import { useState, useEffect } from 'react'
import { useCfbPlayerSearch } from './useCfbPlayerSearch'
import { useNflPlayerSearch } from './useNflPlayerSearch'
import { usePlayerSearch } from './usePlayerSearch'

export type Sport = 'CFB' | 'NFL' | 'NBA' | 'MLB'

export interface UnifiedPlayer {
    id: string
    name: string
    team?: string
    position?: string
    sport: Sport
    teamColor?: string
    class?: string
}

export function useUnifiedPlayerSearch() {
    const [sport, setSport] = useState<Sport>('CFB')
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<UnifiedPlayer[]>([])

    // Use sport-specific hooks
    const cfbSearch = useCfbPlayerSearch()
    const nflSearch = useNflPlayerSearch()
    const nbaSearch = usePlayerSearch()

    // Update query in the appropriate hook when sport changes
    useEffect(() => {
        if (query) {
            switch (sport) {
                case 'CFB':
                    cfbSearch.setQ(query)
                    break
                case 'NFL':
                    nflSearch.setQ(query)
                    break
                case 'NBA':
                    nbaSearch.setQ(query)
                    break
                case 'MLB':
                    // MLB not implemented yet, use empty results
                    setResults([])
                    setLoading(false)
                    break
            }
        } else {
            setResults([])
            setLoading(false)
        }
    }, [query, sport, cfbSearch, nflSearch, nbaSearch])

    // Update loading state and results based on current sport
    useEffect(() => {
        switch (sport) {
            case 'CFB':
                setLoading(cfbSearch.loading)
                setResults(cfbSearch.results.map(player => ({
                    id: player.id,
                    name: player.name,
                    team: player.team,
                    position: player.position,
                    sport: 'CFB' as Sport,
                    teamColor: player.teamColor,
                    class: player.class
                })))
                break
            case 'NFL':
                setLoading(nflSearch.loading)
                setResults(nflSearch.results.map(player => ({
                    id: player.id,
                    name: player.name,
                    team: player.team,
                    position: player.position,
                    sport: 'NFL' as Sport,
                    teamColor: player.teamColor
                })))
                break
            case 'NBA':
                setLoading(nbaSearch.loading)
                setResults(nbaSearch.results.map(player => ({
                    id: player.id,
                    name: player.name,
                    team: player.team,
                    position: player.position,
                    sport: 'NBA' as Sport
                })))
                break
            case 'MLB':
                setLoading(false)
                setResults([])
                break
        }
    }, [sport, cfbSearch.loading, cfbSearch.results, nflSearch.loading, nflSearch.results, nbaSearch.loading, nbaSearch.results])

    const search = (searchQuery: string, searchSport: Sport = sport) => {
        setSport(searchSport)
        setQuery(searchQuery)
    }

    const clear = () => {
        setQuery('')
        setResults([])
        setLoading(false)
    }

    return {
        sport,
        setSport,
        query,
        setQuery: search,
        loading,
        results,
        clear
    }
}
