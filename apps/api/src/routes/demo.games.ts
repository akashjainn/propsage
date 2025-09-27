import { Router } from "express";
import { LRUCache } from "lru-cache";
import fs from "fs";
import path from "path";
import { calculateFairLine, generateWhyCard } from "../services/fairline.calculator.js";

const r = Router();

// Caches for enterprise-grade performance
const gamesCache = new LRUCache<string, any>({ max: 50, ttl: 1000 * 60 * 5 }); // 5min
const playersCache = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 10 }); // 10min
const propsCache = new LRUCache<string, any>({ max: 500, ttl: 1000 * 60 * 3 }); // 3min

// Demo mode delay for realistic API feel
async function demoDelay() {
  const delay = 200 + Math.random() * 700; // 200-900ms as specified
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
 * GET /games?date=YYYY-MM-DD
 * List of games with teams, kickoff times, spreads, totals
 */
r.get("/", async (req, res) => {
  try {
    await demoDelay();
    
    const requestedDate = req.query.date as string || "2025-09-27";
    const cacheKey = `games:${requestedDate}`;
    
    let cached = gamesCache.get(cacheKey);
    if (cached) {
      return res.json({ games: cached, cached: true });
    }
    
    const gamesData = loadFixture("games.demo.json");
    if (!gamesData) {
      return res.status(500).json({ error: "Games data not available" });
    }
    
    // Filter games by date
    let games = gamesData.games.filter((game: any) => game.date === requestedDate);
    
    // Sort by kickoff time
    games = games.sort((a: any, b: any) => a.kickoffET.localeCompare(b.kickoffET));
    
    gamesCache.set(cacheKey, games);
    
    res.json({
      games,
      date: requestedDate,
      total: games.length,
      demoMode: gamesData.demoMode,
      seed: gamesData.seed,
      cached: false
    });
    
  } catch (error) {
    console.error("Games fetch error:", error);
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

/**
 * GET /games/:gameId
 * Detailed game information with team stats and context
 */
r.get("/:gameId", async (req, res) => {
  try {
    await demoDelay();
    
    const gameId = req.params.gameId;
    const cacheKey = `game:${gameId}`;
    
    let cached = gamesCache.get(cacheKey);
    if (cached) {
      return res.json({ game: cached, cached: true });
    }
    
    const gamesData = loadFixture("games.demo.json");
    const game = gamesData?.games.find((g: any) => g.id === gameId);
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    // Enhance with additional context
    const propsData = loadFixture("props.enhanced.demo.json");
    const gameContext = propsData?.gameContext[gameId] || {};
    
    const enhancedGame = {
      ...game,
      context: gameContext,
      propsAvailable: propsData?.props[gameId]?.length || 0
    };
    
    gamesCache.set(cacheKey, enhancedGame);
    
    res.json({ 
      game: enhancedGame, 
      cached: false 
    });
    
  } catch (error) {
    console.error("Game detail fetch error:", error);
    res.status(500).json({ error: "Failed to fetch game details" });
  }
});

export default r;