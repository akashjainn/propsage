import { Router } from "express";
import { LRUCache } from "lru-cache";
const r = Router();
const playerCache = new LRUCache({ max: 500, ttl: 1000 * 60 * 60 }); // 1h
const teamCache = new LRUCache({ max: 10, ttl: 1000 * 60 * 60 * 24 }); // 24h
let ALL_PLAYERS = null;
let ALL_TEAMS = null;
const CFBD_API_KEY = process.env.CFBD_API_KEY || process.env.COLLEGEFOOTBALL_API_KEY;
async function loadAllTeams() {
    if (ALL_TEAMS)
        return ALL_TEAMS;
    try {
        const response = await fetch("https://api.collegefootballdata.com/teams/fbs", {
            headers: {
                'Authorization': `Bearer ${CFBD_API_KEY}`,
                'accept': 'application/json'
            }
        });
        if (!response.ok)
            throw new Error(`Teams API failed: ${response.status}`);
        ALL_TEAMS = await response.json();
        return ALL_TEAMS || [];
    }
    catch (error) {
        console.error("Failed to load CFB teams:", error);
        return [];
    }
}
async function loadAllPlayers() {
    if (ALL_PLAYERS)
        return ALL_PLAYERS;
    try {
        // Priority teams - ensure we get key teams first including Georgia
        const teams = await loadAllTeams();
        const priorityTeams = ['Georgia', 'Alabama', 'Texas', 'Ohio State', 'Michigan', 'USC', 'Notre Dame', 'Florida State', 'Clemson', 'Oregon'];
        const majorTeams = teams.filter(t => ['SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12'].includes(t.conference || ''));
        // Sort to put priority teams first
        majorTeams.sort((a, b) => {
            const aPriority = priorityTeams.includes(a.school) ? 0 : 1;
            const bPriority = priorityTeams.includes(b.school) ? 0 : 1;
            return aPriority - bPriority;
        });
        const allPlayers = [];
        for (const team of majorTeams.slice(0, 35)) { // Increased limit to ensure Georgia is included
            try {
                const response = await fetch(`https://api.collegefootballdata.com/roster?team=${encodeURIComponent(team.school)}&year=2024`, {
                    headers: {
                        'Authorization': `Bearer ${CFBD_API_KEY}`,
                        'accept': 'application/json'
                    }
                });
                if (response.ok) {
                    const roster = await response.json();
                    allPlayers.push(...(roster || []).map((p) => ({
                        ...p,
                        team_name: team.school,
                        team_color: team.color,
                        team_conference: team.conference
                    })));
                }
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                console.warn(`Failed to load roster for ${team.school}:`, error);
            }
        }
        // Ensure Georgia is loaded (fallback for Puglisi and other key players)
        if (!allPlayers.some(p => p.team_name === 'Georgia')) {
            try {
                console.log('Loading Georgia roster specifically...');
                const response = await fetch(`https://api.collegefootballdata.com/roster?team=Georgia&year=2024`, {
                    headers: {
                        'Authorization': `Bearer ${CFBD_API_KEY}`,
                        'accept': 'application/json'
                    }
                });
                if (response.ok) {
                    const roster = await response.json();
                    const georgiaTeam = teams.find(t => t.school === 'Georgia');
                    allPlayers.push(...(roster || []).map((p) => ({
                        ...p,
                        team_name: 'Georgia',
                        team_color: georgiaTeam?.color || '#BA0C2F',
                        team_conference: 'SEC'
                    })));
                    console.log(`Loaded ${roster?.length || 0} Georgia players`);
                }
            }
            catch (error) {
                console.error('Failed to load Georgia roster:', error);
            }
        }
        ALL_PLAYERS = allPlayers;
        return ALL_PLAYERS;
    }
    catch (error) {
        console.error("Failed to load CFB players:", error);
        return [];
    }
}
// Live search fallback for specific players
async function searchPlayerLive(query) {
    try {
        const response = await fetch(`https://api.collegefootballdata.com/player/search?searchTerm=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${CFBD_API_KEY}`,
                'accept': 'application/json'
            }
        });
        if (response.ok) {
            return await response.json();
        }
    }
    catch (error) {
        console.warn('Live player search failed:', error);
    }
    return [];
}
r.get("/", async (req, res) => {
    try {
        const q = String(req.query.q ?? "").trim().toLowerCase();
        if (q.length < 2)
            return res.json([]);
        const hit = playerCache.get(q);
        if (hit)
            return res.json(hit);
        const allPlayers = await loadAllPlayers();
        let out = allPlayers
            .filter(p => p?.first_name || p?.last_name || p?.team_name)
            .map(p => ({
            id: `cfb_${p.id || Math.random().toString(36).substr(2, 9)}`,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
            team: p.team_name,
            teamColor: p.team_color,
            position: p.position,
            class: p.year,
            jersey: p.jersey,
            height: p.height,
            weight: p.weight,
            externalIds: { cfbd: p.id || 0 }
        }))
            .filter(p => {
            const searchText = `${p.name} ${p.team || ''} ${p.position || ''}`.toLowerCase();
            const teamAliases = {
                'uga': 'georgia',
                'georgia': 'georgia',
                'bulldogs': 'georgia',
                'bama': 'alabama',
                'tide': 'alabama',
                'fsu': 'florida state',
                'seminoles': 'florida state'
            };
            // Enhanced search with team aliases
            const queryTerms = q.split(' ');
            return queryTerms.every(term => {
                const aliasedTerm = teamAliases[term] || term;
                return searchText.includes(aliasedTerm);
            });
        })
            .sort((a, b) => {
            // Prioritize QBs and RBs for props
            const aScore = (a.position === 'QB' ? 3 : a.position === 'RB' ? 2 : a.position === 'WR' ? 1 : 0);
            const bScore = (b.position === 'QB' ? 3 : b.position === 'RB' ? 2 : b.position === 'WR' ? 1 : 0);
            if (aScore !== bScore)
                return bScore - aScore;
            // Then by name match relevance
            const aExact = a.name.toLowerCase().startsWith(q) ? 0 : 1;
            const bExact = b.name.toLowerCase().startsWith(q) ? 0 : 1;
            if (aExact !== bExact)
                return aExact - bExact;
            return a.name.localeCompare(b.name);
        })
            .slice(0, 20); // Limit results
        // If no results from cached data, try live search
        if (out.length === 0) {
            console.log(`No cached results for "${q}", trying live search...`);
            const liveResults = await searchPlayerLive(q);
            out = liveResults.map(p => ({
                id: `cfb_live_${p.id || Math.random().toString(36).substr(2, 9)}`,
                name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
                team: p.team,
                teamColor: undefined, // Live results don't have team colors
                position: p.position,
                class: p.year,
                jersey: p.jersey,
                height: p.height,
                weight: p.weight,
                externalIds: { cfbd: p.id || 0 }
            })).slice(0, 10);
        }
        playerCache.set(q, out);
        res.json(out);
    }
    catch (error) {
        console.error("CFB players search error:", error);
        res.status(500).json({ error: "Failed to search CFB players" });
    }
});
// Get team info endpoint for context
r.get("/teams", async (req, res) => {
    try {
        const q = String(req.query.q ?? "").trim().toLowerCase();
        const hit = teamCache.get(q);
        if (hit)
            return res.json(hit);
        const teams = await loadAllTeams();
        const filtered = q ? teams.filter(t => t.school.toLowerCase().includes(q) ||
            (t.mascot || '').toLowerCase().includes(q) ||
            (t.abbreviation || '').toLowerCase().includes(q)).slice(0, 10) : teams.slice(0, 50);
        teamCache.set(q, filtered);
        res.json(filtered);
    }
    catch (error) {
        console.error("CFB teams search error:", error);
        res.status(500).json({ error: "Failed to search CFB teams" });
    }
});
// Get individual player by ID
r.get("/:playerId", async (req, res) => {
    try {
        const playerId = String(req.params.playerId);
        if (!playerId)
            return res.status(400).json({ error: "Player ID required" });
        // Try to find in cached data first
        const allPlayers = await loadAllPlayers();
        let player = allPlayers.find(p => `cfb_${p.id}` === playerId);
        if (!player) {
            // Try live search if not found in cache
            const idMatch = playerId.match(/^cfb_(.+)$/);
            if (idMatch) {
                const cfbdId = idMatch[1];
                // Try to find by CFBD ID or name in live search
                const liveResults = await searchPlayerLive(cfbdId);
                player = liveResults.find(p => p.id.toString() === cfbdId || p.name.toLowerCase().includes(cfbdId.toLowerCase()));
            }
        }
        if (!player) {
            return res.status(404).json({ error: "Player not found" });
        }
        // Convert to standard format
        const result = {
            id: `cfb_${player.id || Math.random().toString(36).substr(2, 9)}`,
            name: player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown',
            team: player.team_name || player.team,
            teamColor: player.team_color,
            position: player.position,
            class: player.year,
            jersey: player.jersey,
            height: player.height,
            weight: player.weight,
            externalIds: { cfbd: player.id || 0 }
        };
        res.json(result);
    }
    catch (error) {
        console.error("CFB player detail error:", error);
        res.status(500).json({ error: "Failed to fetch CFB player details" });
    }
});
export default r;
