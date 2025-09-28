import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

interface EdgeRecord {
  id: string;
  gameId: string;
  player: string;
  team: string;
  market: string; // market line label
  marketLine: number;
  fairLine: number;
  edgePct: number; // positive means OVER value edge
  confidence: number; // 0-1
  bullets?: string[];
  analysis?: string;
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

function convertInsightToEdge(insight: any): EdgeRecord {
  return {
    id: insight.id,
    gameId: insight.gameId || 'unknown',
    player: insight.player,
    team: insight.team,
    market: insight.propType.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    marketLine: insight.marketLine,
    fairLine: insight.fairLine,
    edgePct: insight.edge,
    confidence: insight.confidence / 100, // Convert from 0-100 to 0-1
    bullets: insight.bullets || [],
    analysis: insight.analysis
  };
}

export async function GET(_req: NextRequest, { params }: { params: { gameId: string } }) {
  const { gameId } = params;
  
  try {
    const enhancedData = loadEnhancedInsights();
    let edges: EdgeRecord[] = [];
    
    // Map gameId to team filter
    const normalizedGameId = gameId.toLowerCase().replace(/-20250927$/, ''); // Remove date suffix if present
    const teams = GAME_MAPPINGS[normalizedGameId];
    
    if (teams && enhancedData.insights) {
      // Filter insights by teams in this game and convert to edges
      const relevantInsights = enhancedData.insights.filter((insight: any) => 
        teams.includes(insight.team)
      );
      
      edges = relevantInsights.map(convertInsightToEdge)
        .sort((a: any, b: any) => Math.abs(b.edgePct) - Math.abs(a.edgePct)) // Sort by absolute edge percentage
        .slice(0, 5); // Limit to top 5 edges
    } else {
      // Return top edges from all insights if no specific game mapping
      edges = enhancedData.insights ? enhancedData.insights
        .map(convertInsightToEdge)
        .sort((a: any, b: any) => Math.abs(b.edgePct) - Math.abs(a.edgePct))
        .slice(0, 5) : [];
    }
    
    return NextResponse.json({ edges });
    
  } catch (error) {
    console.error('Error fetching edges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch edges', edges: [] },
      { status: 500 }
    );
  }
}
