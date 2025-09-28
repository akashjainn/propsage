import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Enhanced prop insights with box score data
interface PropInsight {
  player: string;
  playerId: string;
  propType: string;
  marketLine: number;
  fairLine: number;
  edge: number; // percentage
  confidence: number; // 0-100
  bullets: string[];
  position: string;
  team: string;
  analysis?: string;
  gameStats?: {
    completions?: number;
    attempts?: number;
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receivingYards?: number;
    receptions?: number;
  };
}

// Load enhanced insights data
function loadEnhancedInsights(): any {
  try {
    const dataPath = path.join(process.cwd(), '..', 'api', 'data', 'insights.enhanced.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load enhanced insights:', error);
    return { insights: [] };
  }
}

// Game mapping to filter insights
const GAME_MAPPINGS: { [key: string]: string[] } = {
  'game_uga_bama': ['Georgia', 'Alabama'],
  'georgia-vs-alabama': ['Georgia', 'Alabama'],
  'game_gt_wf': ['Georgia Tech', 'Wake Forest'],
  'georgia-tech-vs-wake-forest': ['Georgia Tech', 'Wake Forest'],
  'illinois-vs-usc': ['Illinois', 'USC'],
  'ole-miss-vs-lsu': ['Ole Miss', 'LSU']
};

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const { gameId } = params;
  
  try {
    const enhancedData = loadEnhancedInsights();
    let insights: PropInsight[] = [];
    
    // Map gameId to team filter
    const normalizedGameId = gameId.toLowerCase().replace(/-20250927$/, ''); // Remove date suffix if present
    const teams = GAME_MAPPINGS[normalizedGameId];
    
    if (teams && enhancedData.insights) {
      // Filter insights by teams in this game
      insights = enhancedData.insights.filter((insight: any) => 
        teams.includes(insight.team)
      );
    } else {
      // Return all insights for unknown games
      insights = enhancedData.insights || [];
    }
    
    return NextResponse.json({ 
      gameId,
      insights,
      timestamp: new Date().toISOString(),
      dataSource: 'enhanced_clips'
    });
    
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
