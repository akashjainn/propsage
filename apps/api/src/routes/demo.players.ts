import { Router } from "express";
import { LRUCache } from "lru-cache";
import fs from "fs";
import path from "path";

const r = Router();

// Cache for player data
const playersCache = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 10 }); // 10min

// Demo mode delay
async function demoDelay() {
  const delay = 200 + Math.random() * 700;
  await new Promise(resolve => setTimeout(resolve, delay));
}

function loadFixture(filename: string): any {
  const filePath = path.join(__dirname, "../../data", filename);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  return null;
}

/**
 * GET /players?gameId=game_uga_bama
 * Get roster with depth/position for a specific game
 */
r.get("/", async (req, res) => {
  try {
    await demoDelay();
    
    const gameId = req.query.gameId as string;
    if (!gameId) {
      return res.status(400).json({ error: "gameId parameter required" });
    }
    
    const cacheKey = `players:${gameId}`;
    let cached = playersCache.get(cacheKey);
    if (cached) {
      return res.json({ players: cached, cached: true });
    }
    
    const playersData = loadFixture("players.demo.json");
    if (!playersData || !playersData.players[gameId]) {
      return res.status(404).json({ error: "Players not found for this game" });
    }
    
    const gamePlayers = playersData.players[gameId];
    
    // Flatten and sort players by depth and position priority
    const allPlayers: any[] = [];
    Object.keys(gamePlayers).forEach(teamId => {
      gamePlayers[teamId].forEach((player: any) => {
        allPlayers.push({
          ...player,
          teamId,
          // Add position priority for sorting (QB=1, RB=2, WR=3, TE=4)
          posPriority: player.pos === 'QB' ? 1 : 
                      player.pos === 'RB' ? 2 : 
                      player.pos === 'WR' ? 3 : 4
        });
      });
    });
    
    // Sort by position priority, then by depth
    allPlayers.sort((a, b) => {
      if (a.posPriority !== b.posPriority) return a.posPriority - b.posPriority;
      return a.depth - b.depth;
    });
    
    playersCache.set(cacheKey, allPlayers);
    
    res.json({
      players: allPlayers,
      gameId,
      total: allPlayers.length,
      cached: false
    });
    
  } catch (error) {
    console.error("Players fetch error:", error);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

/**
 * GET /players/:playerId
 * Get detailed player information
 */
r.get("/:playerId", async (req, res) => {
  try {
    await demoDelay();
    
    const playerId = req.params.playerId;
    const cacheKey = `player:${playerId}`;
    
    let cached = playersCache.get(cacheKey);
    if (cached) {
      return res.json({ player: cached, cached: true });
    }
    
    const playersData = loadFixture("players.demo.json");
    let foundPlayer: any = null;
    let foundTeam: string | null = null;
    let foundGame: string | null = null;
    
    // Search through all games and teams
    Object.keys(playersData.players).forEach(gameId => {
      Object.keys(playersData.players[gameId]).forEach(teamId => {
        const player = playersData.players[gameId][teamId].find((p: any) => p.id === playerId);
        if (player) {
          foundPlayer = player;
          foundTeam = teamId;
          foundGame = gameId;
        }
      });
    });
    
    if (!foundPlayer) {
      return res.status(404).json({ error: "Player not found" });
    }
    
    // Enhance with opponent data
    const opponentData = foundTeam && playersData.opponents ? playersData.opponents[foundTeam] || {} : {};
    
    const enhancedPlayer = foundPlayer ? {
      ...foundPlayer,
      gameId: foundGame,
      teamId: foundTeam,
      opponent: opponentData
    } : {};
    
    playersCache.set(cacheKey, enhancedPlayer);
    
    res.json({ 
      player: enhancedPlayer, 
      cached: false 
    });
    
  } catch (error) {
    console.error("Player detail fetch error:", error);
    res.status(500).json({ error: "Failed to fetch player details" });
  }
});

export default r;