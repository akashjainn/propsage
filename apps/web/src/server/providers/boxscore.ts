import type { GameLite } from '@/types/cfb';

interface PlayerStat {
  id: string;
  name: string;
  position?: string;
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  rushingYards?: number;
  rushingTDs?: number;
  receivingYards?: number;
  receivingTDs?: number;
  receptions?: number;
}

interface BoxScoreData {
  gameId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  players: PlayerStat[];
}

// Manual box score data for Illinois vs USC (September 27, 2025)
const ILLINOIS_USC_BOXSCORE: BoxScoreData = {
  gameId: 'illinois-usc-20250927',
  date: '2025-09-27',
  homeTeam: 'Illinois',
  awayTeam: 'USC',
  homeScore: 34,
  awayScore: 32,
  players: [
    {
      id: 'luke-altmyer',
      name: 'Luke Altmyer',
      position: 'QB',
      passingYards: 328,
      passingTDs: 3, // Based on passing TDs in scoring summary
      interceptions: 0, // Not mentioned in summary
      rushingYards: 12, // From the 12-yard TD run
      rushingTDs: 1
    },
    {
      id: 'kaden-feagin',
      name: 'Kaden Feagin',
      position: 'RB',
      rushingYards: 60,
      rushingTDs: 0,
      receivingYards: 64, // From the 64-yard TD pass
      receivingTDs: 1,
      receptions: 1 // At least 1 for the TD
    },
    {
      id: 'justin-bowick',
      name: 'Justin Bowick',
      position: 'WR',
      receivingYards: 25, // From the 25-yard TD pass
      receivingTDs: 1,
      receptions: 1 // At least 1 for the TD
    },
    {
      id: 'collin-dixon',
      name: 'Collin Dixon',
      position: 'WR',
      receivingYards: 90, // From box score summary
      receivingTDs: 0,
      receptions: 3 // Estimated
    },
    {
      id: 'jayden-maiava',
      name: 'Jayden Maiava',
      position: 'QB',
      passingYards: 364,
      passingTDs: 2, // Based on passing TDs to Lemon
      interceptions: 0 // Not mentioned
    },
    {
      id: 'waymond-jordan',
      name: 'Waymond Jordan',
      position: 'RB',
      rushingYards: 94,
      rushingTDs: 2 // Two rushing TDs in scoring summary
    },
    {
      id: 'makai-lemon',
      name: 'Makai Lemon',
      position: 'WR',
      receivingYards: 151,
      receivingTDs: 2, // Two TD passes from Maiava
      receptions: 4 // Estimated
    }
  ]
};

const BOXSCORE_CACHE = new Map<string, BoxScoreData>();
BOXSCORE_CACHE.set('illinois-usc-20250927', ILLINOIS_USC_BOXSCORE);

export async function fetchBoxScore(gameId: string): Promise<BoxScoreData | null> {
  // For now, return cached data. In production, this would scrape or fetch from APIs
  return BOXSCORE_CACHE.get(gameId) || null;
}

export function generatePropFromBoxScore(player: PlayerStat, propType: string, gameId?: string): any {
  // Generate CFBD-compatible propId using game mapping service
  const propId = gameId 
    ? require('../services/gameMapping').createCfbdPropId(gameId, player.name, propType)
    : `${player.id}-${propType}`;
    
  const base = {
    id: propId,
    player: player.name,
    prop: propType,
    position: player.position,
    team: player.id.includes('altmyer') || player.id.includes('feagin') || player.id.includes('bowick') || player.id.includes('dixon') ? 'ILL' : 'USC',
    confidence: 92
  };

  switch (propType) {
    case 'Passing Yards':
      const passingYards = player.passingYards || 0;
      return {
        ...base,
        market: Math.round(passingYards * 0.9), // Mock market line slightly under actual
        fair: passingYards,
        edge: ((passingYards - (passingYards * 0.9)) / (passingYards * 0.9) * 100).toFixed(1)
      };
    case 'Passing Touchdowns':
      const passingTDs = player.passingTDs || 0;
      return {
        ...base,
        market: Math.max(0.5, passingTDs - 0.5),
        fair: passingTDs,
        edge: ((passingTDs - Math.max(0.5, passingTDs - 0.5)) / Math.max(0.5, passingTDs - 0.5) * 100).toFixed(1)
      };
    case 'Rushing Yards':
      const rushingYards = player.rushingYards || 0;
      return {
        ...base,
        market: Math.round(rushingYards * 0.85),
        fair: rushingYards,
        edge: ((rushingYards - (rushingYards * 0.85)) / (rushingYards * 0.85) * 100).toFixed(1)
      };
    case 'Receiving Yards':
      const receivingYards = player.receivingYards || 0;
      return {
        ...base,
        market: Math.round(receivingYards * 0.88),
        fair: receivingYards,
        edge: ((receivingYards - (receivingYards * 0.88)) / (receivingYards * 0.88) * 100).toFixed(1)
      };
    default:
      return null;
  }
}

export function getGameFromBoxScore(gameId: string): GameLite | null {
  const boxScore = BOXSCORE_CACHE.get(gameId);
  if (!boxScore) return null;

  return {
    id: gameId,
    start: new Date(boxScore.date).toISOString(),
    state: 'post', // Game is completed
    home: {
      id: 'illinois',
      name: 'Illinois Fighting Illini',
      short: 'Illinois',
      abbrev: 'ILL',
      logo: 'https://dxbhsrqyrr690.cloudfront.net/sidearm.nextgen.sites/fightingillini.com/images/logos/site/site.png',
      color: 'E84A27'
    },
    away: {
      id: 'usc',
      name: 'USC Trojans',
      short: 'USC',
      abbrev: 'USC',
      logo: 'https://fightingillini.com/services/logo_handler.ashx?image_path=/images/logos/usc-primary-200x200.png',
      color: '990000'
    },
    venue: { name: 'Gies Memorial Stadium', city: 'Champaign', state: 'Illinois' },
    broadcast: { network: 'BTN' },
    homeScore: boxScore.homeScore,
    awayScore: boxScore.awayScore,
  };
}