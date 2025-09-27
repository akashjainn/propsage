import { PropInsights, InsightBullet, ClipRef } from '../../types/insights';
import { fetchCfbdGamePlayerStats, fetchCfbdGameTeamStats } from '../providers/cfbd';

// Types for CFBD responses
interface CfbdPlayerStat {
  playerId: number;
  player: string;
  team: string;
  category: string;
  stat: string;
  value: number;
}

interface CfbdTeamStat {
  team: string;
  stats: Array<{ category: string; stat: string; value: number }>;
}

// Fair line calculation formulas
const FAIR_LINE_FORMULAS = {
  // Passing
  'passing_yards': (actual: number) => actual * 0.95, // Slight regression
  'passing_tds': (actual: number) => Math.max(0.5, actual * 0.9),
  'completions': (actual: number) => actual * 0.92,
  
  // Rushing  
  'rushing_yards': (actual: number) => actual * 0.93,
  'rushing_tds': (actual: number) => Math.max(0.5, actual * 0.88),
  'rushing_attempts': (actual: number) => actual * 0.96,
  
  // Receiving
  'receiving_yards': (actual: number) => actual * 0.91,
  'receiving_tds': (actual: number) => Math.max(0.5, actual * 0.85),
  'receptions': (actual: number) => actual * 0.94,
};

// Mock market lines (in production, fetch from sportsbook APIs)
const MOCK_MARKET_LINES: Record<string, number> = {
  'passing_yards': 275,
  'passing_tds': 2.5,
  'completions': 22.5,
  'rushing_yards': 85,
  'rushing_tds': 0.5,
  'rushing_attempts': 15.5,
  'receiving_yards': 65,
  'receiving_tds': 0.5,
  'receptions': 4.5,
};

export async function generatePropInsights(
  gameId: number,
  playerName: string,
  propType: string
): Promise<PropInsights> {
  try {
    // Fetch actual game stats from CFBD
    const playerStats = await fetchCfbdGamePlayerStats(gameId);
    
    // Find the specific player's stat
    const playerStat = playerStats.find(
      (stat: CfbdPlayerStat) => 
        stat.player.toLowerCase().includes(playerName.toLowerCase()) &&
        stat.stat === propType
    );
    
    if (!playerStat) {
      throw new Error(`No stats found for ${playerName} - ${propType}`);
    }
    
    const actualValue = playerStat.value;
    
    // Calculate fair line using formula
    const fairLineFormula = FAIR_LINE_FORMULAS[propType as keyof typeof FAIR_LINE_FORMULAS];
    const fairLine = fairLineFormula ? fairLineFormula(actualValue) : actualValue * 0.9;
    
    // Get market line (mock for now)
    const marketLine = MOCK_MARKET_LINES[propType] || fairLine + 10;
    
    // Calculate edge percentage
    const edgePct = ((fairLine - marketLine) / marketLine) * 100;
    
    // Generate insights bullets
    const bullets = generateInsightsBullets(playerStat, fairLine, marketLine, edgePct);
    
    return {
      propId: `${gameId}-${playerName}-${propType}`,
      playerId: playerStat.playerId.toString(),
      propType: mapPropTypeToStandard(propType),
      marketLine,
      fairLine: Number(fairLine.toFixed(1)),
      edgePct: Number(edgePct.toFixed(1)),
      bullets,
      supportingClips: [], // Will be populated by existing clip search
      confidence: calculateConfidence(edgePct),
      updatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error generating prop insights:', error);
    
    // Fallback to mock data if CFBD fails
    return {
      propId: `mock-${playerName}-${propType}`,
      playerId: 'unknown',
      propType: mapPropTypeToStandard(propType),
      marketLine: MOCK_MARKET_LINES[propType] || 100,
      fairLine: (MOCK_MARKET_LINES[propType] || 100) * 0.95,
      edgePct: -5.2,
      bullets: [
        { title: '🔄 Using fallback analysis due to data unavailability' },
        { title: '📊 Historical trends suggest market inefficiency' },
        { title: '⚠️ Limited statistical confidence' }
      ],
      supportingClips: [],
      confidence: 'low',
      updatedAt: new Date().toISOString()
    };
  }
}

function generateInsightsBullets(
  playerStat: CfbdPlayerStat,
  fairLine: number,
  marketLine: number,
  edgePct: number
): InsightBullet[] {
  const bullets: InsightBullet[] = [];
  
  // Performance analysis
  if (playerStat.value > fairLine) {
    bullets.push({
      title: `📈 ${playerStat.player} exceeded fair line by ${((playerStat.value / fairLine - 1) * 100).toFixed(1)}%`,
      weight: 8
    });
  } else {
    bullets.push({
      title: `📉 ${playerStat.player} underperformed fair line by ${((1 - playerStat.value / fairLine) * 100).toFixed(1)}%`,
      weight: 7
    });
  }
  
  // Market vs Fair comparison
  if (Math.abs(edgePct) > 10) {
    bullets.push({
      title: `🎯 Significant ${edgePct > 0 ? 'UNDER' : 'OVER'} edge detected (${Math.abs(edgePct).toFixed(1)}%)`,
      weight: 10
    });
  } else if (Math.abs(edgePct) > 5) {
    bullets.push({
      title: `📊 Moderate ${edgePct > 0 ? 'UNDER' : 'OVER'} value (${Math.abs(edgePct).toFixed(1)}%)`,
      weight: 6
    });
  } else {
    bullets.push({
      title: `⚖️ Market closely aligned with fair value (${Math.abs(edgePct).toFixed(1)}% difference)`,
      weight: 4
    });
  }
  
  // Actual performance context
  bullets.push({
    title: `🏆 Actual game result: ${playerStat.value} ${playerStat.stat.replace('_', ' ')}`,
    weight: 9
  });
  
  // Team context
  bullets.push({
    title: `🏈 Game context: ${playerStat.team} performance analysis`,
    weight: 5
  });
  
  return bullets;
}

function calculateConfidence(edgePct: number): 'high' | 'med' | 'low' {
  const absEdge = Math.abs(edgePct);
  if (absEdge > 15) return 'high';
  if (absEdge > 7) return 'med';
  return 'low';
}

// Helper function to map prop types to CFBD stats
export function mapPropTypeToCfbdStat(propType: string): string {
  const mapping: Record<string, string> = {
    'passing_yards': 'passingYards',
    'passing_tds': 'passingTDs',
    'rushing_yards': 'rushingYards',
    'rushing_tds': 'rushingTDs',
    'receiving_yards': 'receivingYards',
    'receiving_tds': 'receivingTDs',
    'receptions': 'receptions',
    'completions': 'completions',
  };
  
  return mapping[propType] || propType;
}

// Map generic prop types to PropInsights standard types
function mapPropTypeToStandard(propType: string): PropInsights['propType'] {
  const mapping: Record<string, PropInsights['propType']> = {
    'passing_yards': 'passing_yds',
    'rushing_yards': 'rushing_yds',
    'passing_tds': 'pass_tds',
    'rushing_tds': 'rush_tds',
    'receptions': 'receptions',
    'points': 'points'
  };
  
  return mapping[propType] || 'passing_yds'; // Default fallback
}