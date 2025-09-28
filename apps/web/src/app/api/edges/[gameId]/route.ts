import { NextRequest, NextResponse } from 'next/server';

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
}

// Basic mock edges keyed by gameId for demo reliability
const MOCK_EDGES: Record<string, EdgeRecord[]> = {
  'gt-wake-forest-20250927': [
    { id: 'e-gt-1', gameId: 'gt-wake-forest-20250927', player: 'Haynes King', team: 'Georgia Tech', market: 'Passing TDs', marketLine: 1.5, fairLine: 1.82, edgePct: 12.5, confidence: 0.91 },
    { id: 'e-gt-2', gameId: 'gt-wake-forest-20250927', player: 'Eric Singleton Jr.', team: 'Georgia Tech', market: 'Receiving Yards', marketLine: 58.5, fairLine: 66.3, edgePct: 13.3, confidence: 0.88 },
    { id: 'e-gt-3', gameId: 'gt-wake-forest-20250927', player: 'Wake QB', team: 'Wake Forest', market: 'Interceptions Thrown', marketLine: 0.5, fairLine: 0.73, edgePct: 9.8, confidence: 0.79 }
  ],
  'illinois-usc-20250927': [
    { id: 'e-ill-1', gameId: 'illinois-usc-20250927', player: 'Luke Altmyer', team: 'Illinois', market: 'Passing Yards', marketLine: 215.5, fairLine: 238.2, edgePct: 10.5, confidence: 0.94 },
    { id: 'e-ill-2', gameId: 'illinois-usc-20250927', player: 'Kaden Feagin', team: 'Illinois', market: 'Receiving Yards', marketLine: 19.5, fairLine: 24.1, edgePct: 7.5, confidence: 0.82 },
    { id: 'e-ill-3', gameId: 'illinois-usc-20250927', player: 'USC RB', team: 'USC', market: 'Rushing Attempts', marketLine: 13.5, fairLine: 11.8, edgePct: -6.0, confidence: 0.76 }
  ]
};

async function fetchRealEdges(_gameId: string): Promise<EdgeRecord[]> {
  // Placeholder: integrate real pricing / model service here.
  return [];
}

export async function GET(_req: NextRequest, { params }: { params: { gameId: string } }) {
  const { gameId } = params;
  try {
    const real = await fetchRealEdges(gameId);
    if (real.length) {
      return NextResponse.json({ edges: real });
    }
  } catch (e) {
    console.warn('[edges] real fetch failed, using fallback:', (e as Error).message);
  }

  const fallback = MOCK_EDGES[gameId] || Object.values(MOCK_EDGES).flat().slice(0, 3);
  return NextResponse.json({ edges: fallback });
}