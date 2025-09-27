import { Router } from 'express';
import { LRUCache } from 'lru-cache';
import { computeFairline } from '../services/fairline.js';

const router = Router();

// Cache props for 15 minutes to avoid excessive computation
const propsCache = new LRUCache<string, any>({ max: 1000, ttl: 1000 * 60 * 15 });

export interface PropData {
  propId: string;
  playerId: string;
  playerName: string;
  team: string;
  stat: string;
  book: string;
  marketLine: number;
  fairLine: number;
  edgePct: number;
  confidence?: number;
  updatedAt: string;
}

export interface PropDetail extends PropData {
  history: Array<{
    t: string;
    market: number;
    fair: number;
  }>;
}

// Mock market data - in production this would come from odds API
const MOCK_PROPS = [
  // LeBron James
  { playerId: 'nba_237', playerName: 'LeBron James', team: 'LAL', stat: 'PTS', book: 'DK', marketLine: 25.5 },
  { playerId: 'nba_237', playerName: 'LeBron James', team: 'LAL', stat: 'PTS', book: 'FD', marketLine: 26.0 },
  { playerId: 'nba_237', playerName: 'LeBron James', team: 'LAL', stat: 'REB', book: 'DK', marketLine: 7.5 },
  { playerId: 'nba_237', playerName: 'LeBron James', team: 'LAL', stat: 'AST', book: 'FD', marketLine: 8.0 },
  
  // Stephen Curry
  { playerId: 'nba_115', playerName: 'Stephen Curry', team: 'GSW', stat: 'PTS', book: 'DK', marketLine: 26.5 },
  { playerId: 'nba_115', playerName: 'Stephen Curry', team: 'GSW', stat: '3PM', book: 'DK', marketLine: 4.5 },
  { playerId: 'nba_115', playerName: 'Stephen Curry', team: 'GSW', stat: 'AST', book: 'FD', marketLine: 5.5 },
  
  // Luka Doncic  
  { playerId: 'nba_666', playerName: 'Luka Doncic', team: 'DAL', stat: 'PTS', book: 'DK', marketLine: 32.5 },
  { playerId: 'nba_666', playerName: 'Luka Doncic', team: 'DAL', stat: 'REB', book: 'FD', marketLine: 9.0 },
  { playerId: 'nba_666', playerName: 'Luka Doncic', team: 'DAL', stat: 'AST', book: 'DK', marketLine: 9.5 },
  
  // Giannis Antetokounmpo
  { playerId: 'nba_145', playerName: 'Giannis Antetokounmpo', team: 'MIL', stat: 'PTS', book: 'DK', marketLine: 30.5 },
  { playerId: 'nba_145', playerName: 'Giannis Antetokounmpo', team: 'MIL', stat: 'REB', book: 'FD', marketLine: 11.0 },
  
  // Anthony Edwards
  { playerId: 'nba_3547', playerName: 'Anthony Edwards', team: 'MIN', stat: 'PTS', book: 'DK', marketLine: 25.5 },
  { playerId: 'nba_3547', playerName: 'Anthony Edwards', team: 'MIN', stat: 'REB', book: 'FD', marketLine: 5.5 },
  { playerId: 'nba_3547', playerName: 'Anthony Edwards', team: 'MIN', stat: 'AST', book: 'DK', marketLine: 5.0 },
];

function generatePropId(playerId: string, stat: string, book: string): string {
  return `prop_${playerId}_${stat.toLowerCase()}_${book.toLowerCase()}`;
}

function calculateEdgePercent(marketLine: number, fairLine: number): number {
  if (marketLine === 0) return 0;
  return Math.round(((fairLine - marketLine) / marketLine) * 1000) / 10;
}

// GET /nba/props?playerId=nba_237
router.get('/props', async (req, res) => {
  try {
    const { playerId } = req.query;
    
    if (!playerId) {
      return res.status(400).json({ error: 'playerId is required' });
    }
    
    const cacheKey = `props_${playerId}`;
    const cached = propsCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Filter props for this player
    const playerProps = MOCK_PROPS.filter(p => p.playerId === playerId);
    
    if (playerProps.length === 0) {
      return res.json({
        player: { id: playerId, name: 'Player', team: '---', position: null },
        props: []
      });
    }
    
    // Compute fair lines and edges
    const props = await Promise.all(playerProps.map(async (prop) => {
      const fairLineResult = computeFairline({
        player_id: prop.playerId,
        market: prop.stat.toLowerCase(),
        line: prop.marketLine
      });
      
      const fairLine = fairLineResult?.fair_line ?? prop.marketLine;
      const edgePct = calculateEdgePercent(prop.marketLine, fairLine);
      
      return {
        propId: generatePropId(prop.playerId, prop.stat, prop.book),
        playerId: prop.playerId,
        playerName: prop.playerName,
        team: prop.team,
        stat: prop.stat,
        book: prop.book,
        marketLine: prop.marketLine,
        fairLine: Math.round(fairLine * 10) / 10,
        edgePct,
        confidence: fairLineResult?.conf_high ? 0.8 : 0.6,
        updatedAt: new Date().toISOString()
      };
    }));
    
    const result = {
      player: {
        id: playerId,
        name: playerProps[0].playerName,
        team: playerProps[0].team,
        position: null
      },
      props
    };
    
    propsCache.set(cacheKey, result);
    res.json(result);
    
  } catch (error) {
    console.error('Props API error:', error);
    res.status(500).json({ error: 'Failed to fetch props' });
  }
});

// GET /nba/props/prop_nba_237_pts_dk
router.get('/props/:propId', async (req, res) => {
  try {
    const { propId } = req.params;
    
    const cacheKey = `prop_detail_${propId}`;
    const cached = propsCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Parse propId to find the prop
    const parts = propId.split('_');
    if (parts.length < 4) {
      return res.status(400).json({ error: 'Invalid propId format' });
    }
    
    const playerId = `${parts[1]}_${parts[2]}`;
    const stat = parts[3].toUpperCase();
    const book = parts[4].toUpperCase();
    
    // Find the prop in mock data
    const prop = MOCK_PROPS.find(p => 
      p.playerId === playerId && 
      p.stat === stat && 
      p.book.toLowerCase() === book.toLowerCase()
    );
    
    if (!prop) {
      return res.status(404).json({ error: 'Prop not found' });
    }
    
    // Compute fair line
    const fairLineResult = computeFairline({
      player_id: prop.playerId,
      market: prop.stat.toLowerCase(),
      line: prop.marketLine
    });
    
    const fairLine = fairLineResult?.fair_line ?? prop.marketLine;
    const edgePct = calculateEdgePercent(prop.marketLine, fairLine);
    
    // Generate mock history (last 24 hours, hourly)
    const history = [];
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString();
      const marketJitter = prop.marketLine + (Math.random() - 0.5) * 1.0;
      const fairJitter = fairLine + (Math.random() - 0.5) * 0.8;
      
      history.push({
        t: timestamp,
        market: Math.round(marketJitter * 10) / 10,
        fair: Math.round(fairJitter * 10) / 10
      });
    }
    
    const result: PropDetail = {
      propId,
      playerId: prop.playerId,
      playerName: prop.playerName,
      team: prop.team,
      stat: prop.stat,
      book: prop.book,
      marketLine: prop.marketLine,
      fairLine: Math.round(fairLine * 10) / 10,
      edgePct,
      confidence: fairLineResult?.conf_high ? 0.8 : 0.6,
      updatedAt: new Date().toISOString(),
      history
    };
    
    propsCache.set(cacheKey, result);
    res.json(result);
    
  } catch (error) {
    console.error('Prop detail error:', error);
    res.status(500).json({ error: 'Failed to fetch prop details' });
  }
});

export default router;