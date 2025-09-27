// Helper functions to map between game identifiers and CFBD game IDs

interface GameMapping {
  gameId: string;           // Our internal game ID (e.g., 'illinois-usc-20250927')
  cfbdGameId: number;       // CFBD's numeric game ID
  homeTeam: string;
  awayTeam: string;
  date: string;
  season: number;
  week?: number;
}

// Static mappings for demo games (in production, this would be dynamic)
const GAME_MAPPINGS: GameMapping[] = [
  {
    gameId: 'illinois-usc-20250927',
    cfbdGameId: 401635510,
    homeTeam: 'USC',
    awayTeam: 'Illinois',
    date: '2025-09-27',
    season: 2025,
    week: 4
  },
  {
    gameId: 'georgia-tech-wake-forest',
    cfbdGameId: 401628467,
    homeTeam: 'Wake Forest', 
    awayTeam: 'Georgia Tech',
    date: '2024-11-30',
    season: 2024,
    week: 14
  }
  // Add more mappings as needed
];

export function getCfbdGameId(gameId: string): number | null {
  const mapping = GAME_MAPPINGS.find(m => m.gameId === gameId);
  return mapping?.cfbdGameId || null;
}

export function getGameMapping(gameId: string): GameMapping | null {
  return GAME_MAPPINGS.find(m => m.gameId === gameId) || null;
}

export function findGameByTeams(team1: string, team2: string): GameMapping | null {
  return GAME_MAPPINGS.find(m => 
    (m.homeTeam.toLowerCase().includes(team1.toLowerCase()) && m.awayTeam.toLowerCase().includes(team2.toLowerCase())) ||
    (m.homeTeam.toLowerCase().includes(team2.toLowerCase()) && m.awayTeam.toLowerCase().includes(team1.toLowerCase()))
  ) || null;
}

export function getAllGameMappings(): GameMapping[] {
  return GAME_MAPPINGS;
}

// Helper to create CFBD-compatible propId
export function createCfbdPropId(gameId: string, playerName: string, propType: string): string {
  const cfbdGameId = getCfbdGameId(gameId);
  if (!cfbdGameId) {
    // Fallback to regular propId format
    return `${playerName.toLowerCase().replace(/\s+/g, '-')}-${propType.toLowerCase().replace(/\s+/g, '_')}`;
  }
  
  return `${cfbdGameId}-${playerName.toLowerCase().replace(/\s+/g, '-')}-${propType.toLowerCase().replace(/\s+/g, '_')}`;
}

// Helper to parse CFBD propId back to components
export function parseCfbdPropId(propId: string): { cfbdGameId: number | null; playerName: string; propType: string } | null {
  const parts = propId.split('-');
  
  if (parts.length >= 3) {
    const potentialGameId = parseInt(parts[0]);
    
    if (!isNaN(potentialGameId)) {
      return {
        cfbdGameId: potentialGameId,
        playerName: parts.slice(1, -1).join('-'),
        propType: parts[parts.length - 1]
      };
    }
  }
  
  return null;
}