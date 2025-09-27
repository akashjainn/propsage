import { NextResponse } from 'next/server';
import { getInsights } from '@/server/mockInsights';
import { generatePropInsights } from '@/server/services/propInsightsMapper';

export async function GET(_: Request, { params }: { params: { propId: string } }) {
  const { propId } = params;
  
  try {
    // Parse propId format: gameId-playerName-propType
    const propParts = propId.split('-');
    
    if (propParts.length >= 3) {
      const gameId = parseInt(propParts[0]);
      const playerName = propParts.slice(1, -1).join('-'); // Handle names with hyphens
      const propType = propParts[propParts.length - 1];
      
      // Only try CFBD for valid gameIds (numeric)
      if (!isNaN(gameId)) {
        console.log(`Generating CFBD insights for: ${playerName} ${propType} (Game ${gameId})`);
        const cfbdInsight = await generatePropInsights(gameId, playerName, propType);
        return NextResponse.json(cfbdInsight);
      }
    }
    
    // Fallback to mock insights for invalid propIds or CFBD failures
    console.log(`Using mock insights for propId: ${propId}`);
    const data = await getInsights(propId);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error generating insights:', error);
    
    // Fallback to mock data on any error
    const data = await getInsights(propId);
    return NextResponse.json(data);
  }
}
