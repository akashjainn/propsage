import { Router } from "express";
import { LRUCache } from "lru-cache";

const r = Router();

type CfbPlayer = {
  id: string;                // "cfb_<cfbdId>"
  name: string;              // "Carson Beck"
  team?: string;             // "Georgia"
  teamColor?: string;        // "#BA0C2F"
  position?: string;         // "QB"
  class?: string;            // "Senior"
  jersey?: number;           // 15
  height?: number;           // 72 (inches)
  weight?: number;           // 220 (pounds)
  externalIds: { cfbd: number };
};

type CfbTeam = {
  id: number;
  school: string;
  mascot?: string;
  abbreviation?: string;
  alt_name_1?: string;
  alt_name_2?: string;
  alt_name_3?: string;
  conference?: string;
  division?: string;
  classification?: string;
  color?: string;
  alt_color?: string;
  logos?: string[];
};

const playerCache = new LRUCache<string, CfbPlayer[]>({ max: 500, ttl: 1000*60*60 }); // 1h
const teamCache = new LRUCache<string, CfbTeam[]>({ max: 10, ttl: 1000*60*60*24 }); // 24h
let ALL_PLAYERS: any[] | null = null;
let ALL_TEAMS: CfbTeam[] | null = null;

const CFBD_API_KEY = process.env.CFBD_API_KEY || process.env.COLLEGEFOOTBALL_API_KEY;

async function loadAllTeams(): Promise<CfbTeam[]> {
  if (ALL_TEAMS) return ALL_TEAMS;
  
  try {
    const response = await fetch("https://api.collegefootballdata.com/teams/fbs", {
      headers: {
        'Authorization': `Bearer ${CFBD_API_KEY}`,
        'accept': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`Teams API failed: ${response.status}`);
    ALL_TEAMS = await response.json();
    return ALL_TEAMS || [];
  } catch (error) {
    console.error("Failed to load CFB teams:", error);
    return [];
  }
}

async function loadAllPlayers(): Promise<any[]> {
  if (ALL_PLAYERS) return ALL_PLAYERS;
  
  try {
    // Get current season's roster data for major teams
    const teams = await loadAllTeams();
    const majorTeams = teams.filter(t => 
      ['SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12'].includes(t.conference || '')
    ).slice(0, 50); // Limit to avoid rate limits
    
    const allPlayers: any[] = [];
    
    for (const team of majorTeams.slice(0, 25)) { // Further limit for demo
      try {
        const response = await fetch(`https://api.collegefootballdata.com/roster?team=${encodeURIComponent(team.school)}&year=2024`, {
          headers: {
            'Authorization': `Bearer ${CFBD_API_KEY}`,
            'accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const roster = await response.json();
          allPlayers.push(...(roster || []).map((p: any) => ({
            ...p,
            team_name: team.school,
            team_color: team.color,
            team_conference: team.conference
          })));
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to load roster for ${team.school}:`, error);
      }
    }
    
    ALL_PLAYERS = allPlayers;
    return ALL_PLAYERS;
  } catch (error) {
    console.error("Failed to load CFB players:", error);
    return [];
  }
}

r.get("/", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim().toLowerCase();
    if (q.length < 2) return res.json([]);

    const hit = playerCache.get(q);
    if (hit) return res.json(hit);

    const allPlayers = await loadAllPlayers();
    const out: CfbPlayer[] = allPlayers
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
        return searchText.includes(q);
      })
      .sort((a, b) => {
        // Prioritize QBs and RBs for props
        const aScore = (a.position === 'QB' ? 3 : a.position === 'RB' ? 2 : a.position === 'WR' ? 1 : 0);
        const bScore = (b.position === 'QB' ? 3 : b.position === 'RB' ? 2 : b.position === 'WR' ? 1 : 0);
        if (aScore !== bScore) return bScore - aScore;
        
        // Then by name match relevance
        const aExact = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bExact = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        
        return a.name.localeCompare(b.name);
      })
      .slice(0, 20); // Limit results

    playerCache.set(q, out);
    res.json(out);
  } catch (error) {
    console.error("CFB players search error:", error);
    res.status(500).json({ error: "Failed to search CFB players" });
  }
});

// Get team info endpoint for context
r.get("/teams", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim().toLowerCase();
    
    const hit = teamCache.get(q);
    if (hit) return res.json(hit);
    
    const teams = await loadAllTeams();
    const filtered = q ? teams.filter(t => 
      t.school.toLowerCase().includes(q) ||
      (t.mascot || '').toLowerCase().includes(q) ||
      (t.abbreviation || '').toLowerCase().includes(q)
    ).slice(0, 10) : teams.slice(0, 50);
    
    teamCache.set(q, filtered);
    res.json(filtered);
  } catch (error) {
    console.error("CFB teams search error:", error);
    res.status(500).json({ error: "Failed to search CFB teams" });
  }
});

export default r;