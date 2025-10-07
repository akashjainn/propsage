// TheOddsApi service for PropSage - Real market lines integration
import { config } from '../config.js';
class TheOddsApiService {
    apiKey;
    baseUrl = 'https://api.the-odds-api.com/v4';
    requestCount = 0;
    maxRequests = 450; // Leave some buffer from 500 limit
    constructor() {
        this.apiKey = config.oddsApiKey || '';
        if (!this.apiKey && !config.demoMode) {
            console.warn('⚠️  No Odds API key provided - using demo data only');
        }
    }
    canMakeRequest() {
        if (this.requestCount >= this.maxRequests) {
            console.warn(`⚠️  Odds API request limit reached: ${this.requestCount}/${this.maxRequests}`);
            return false;
        }
        return true;
    }
    incrementRequestCount() {
        this.requestCount++;
        console.log(`📊 Odds API requests used: ${this.requestCount}/${this.maxRequests}`);
    }
    /**
     * Fetch NBA player props from TheOddsApi
     */
    async fetchNBAPlayerProps() {
        if (!this.apiKey || !this.canMakeRequest()) {
            console.log('🔄 Using demo data (no API key or limit reached)');
            return [];
        }
        try {
            this.incrementRequestCount();
            const url = `${this.baseUrl}/sports/basketball_nba/odds`;
            const params = new URLSearchParams({
                apiKey: this.apiKey,
                regions: 'us',
                markets: 'player_points,player_rebounds,player_assists,player_threes',
                oddsFormat: 'american',
                dateFormat: 'iso'
            });
            console.log(`🏀 Fetching NBA player props from TheOddsApi...`);
            const response = await fetch(`${url}?${params}`);
            if (!response.ok) {
                throw new Error(`Odds API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const props = this.parsePlayerProps(data);
            console.log(`✅ Fetched ${props.length} player props from ${data.length} games`);
            return props;
        }
        catch (error) {
            console.error('❌ Error fetching from Odds API:', error);
            return [];
        }
    }
    /**
     * Parse OddsApi response into PropLine format
     */
    parsePlayerProps(games) {
        const props = [];
        for (const game of games) {
            for (const bookmaker of game.bookmakers) {
                // Focus on major sportsbooks
                if (!['draftkings', 'fanduel', 'prizepicks', 'underdog'].includes(bookmaker.key)) {
                    continue;
                }
                for (const market of bookmaker.markets) {
                    const marketType = this.mapMarketType(market.key);
                    if (!marketType)
                        continue;
                    for (const outcome of market.outcomes) {
                        if (outcome.point && outcome.name) {
                            const playerId = this.normalizePlayerName(outcome.name);
                            props.push({
                                playerId,
                                market: marketType,
                                line: outcome.point,
                                price: outcome.price,
                                source: bookmaker.key,
                                ts: new Date().toISOString(),
                                gameId: game.id,
                                team: this.getPlayerTeam(outcome.name, game.home_team, game.away_team)
                            });
                        }
                    }
                }
            }
        }
        return props;
    }
    /**
     * Map Odds API market keys to our format
     */
    mapMarketType(market) {
        const mapping = {
            'player_points': 'PTS',
            'player_rebounds': 'REB',
            'player_assists': 'AST',
            'player_threes': '3PM'
        };
        return mapping[market] || null;
    }
    /**
     * Normalize player names to match our ID format
     */
    normalizePlayerName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }
    /**
     * Determine player team based on game context
     */
    getPlayerTeam(playerName, homeTeam, awayTeam) {
        // Simple heuristic - in production you'd want a player-to-team mapping
        // For now, return the home team as default
        return homeTeam;
    }
    /**
     * Get request usage stats
     */
    getUsageStats() {
        return {
            used: this.requestCount,
            remaining: this.maxRequests - this.requestCount,
            limit: this.maxRequests
        };
    }
}
export const oddsApiService = new TheOddsApiService();
