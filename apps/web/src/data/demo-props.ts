// Demo prop lines for the UGA vs Alabama game and other key matchups
// This ensures we have guaranteed data for the demo

export interface DemoPropLine {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  team: string;
  market: string;
  marketLine: number;
  fairLine: number;
  edgePct: number;
  confidence: number;
  lastUpdated: string;
  overUnder: 'over' | 'under';
  recommendation: 'strong_over' | 'over' | 'under' | 'strong_under' | 'no_bet';
}

export const DEMO_PROP_LINES: DemoPropLine[] = [
  // UGA vs Alabama - Gunner Stockton props
  {
    id: 'uga_bama_stockton_pass_yards',
    gameId: 'uga-alabama-20250927',
    playerId: 'cfb_gunner_stockton',
    playerName: 'Gunner Stockton',
    team: 'Georgia',
    market: 'Passing Yards',
    marketLine: 242.5,
    fairLine: 268.3,
    edgePct: 10.6,
    confidence: 0.87,
    lastUpdated: new Date().toISOString(),
    overUnder: 'over',
    recommendation: 'strong_over'
  },
  {
    id: 'uga_bama_stockton_pass_tds',
    gameId: 'uga-alabama-20250927',
    playerId: 'cfb_gunner_stockton',
    playerName: 'Gunner Stockton',
    team: 'Georgia',
    market: 'Passing Touchdowns',
    marketLine: 1.5,
    fairLine: 2.1,
    edgePct: 15.2,
    confidence: 0.82,
    lastUpdated: new Date().toISOString(),
    overUnder: 'over',
    recommendation: 'strong_over'
  },
  {
    id: 'uga_bama_stockton_interceptions',
    gameId: 'uga-alabama-20250927',
    playerId: 'cfb_gunner_stockton',
    playerName: 'Gunner Stockton',
    team: 'Georgia',
    market: 'Interceptions',
    marketLine: 0.5,
    fairLine: 0.8,
    edgePct: -12.5,
    confidence: 0.75,
    lastUpdated: new Date().toISOString(),
    overUnder: 'over',
    recommendation: 'no_bet'
  },
  
  // UGA vs Alabama - Trevor Etienne props
  {
    id: 'uga_bama_etienne_rush_yards',
    gameId: 'uga-alabama-20250927',
    playerId: 'cfb_trevor_etienne',
    playerName: 'Trevor Etienne',
    team: 'Georgia',
    market: 'Rushing Yards',
    marketLine: 89.5,
    fairLine: 107.2,
    edgePct: 19.8,
    confidence: 0.91,
    lastUpdated: new Date().toISOString(),
    overUnder: 'over',
    recommendation: 'strong_over'
  },
  {
    id: 'uga_bama_etienne_rush_tds',
    gameId: 'uga-alabama-20250927',
    playerId: 'cfb_trevor_etienne',
    playerName: 'Trevor Etienne',
    team: 'Georgia',
    market: 'Rushing Touchdowns',
    marketLine: 0.5,
    fairLine: 0.7,
    edgePct: 8.3,
    confidence: 0.68,
    lastUpdated: new Date().toISOString(),
    overUnder: 'over',
    recommendation: 'over'
  },
  
  // Alabama - Jalen Milroe props
  {
    id: 'uga_bama_milroe_pass_yards',
    gameId: 'uga-alabama-20250927',
    playerId: 'cfb_jalen_milroe',
    playerName: 'Jalen Milroe',
    team: 'Alabama',
    market: 'Passing Yards',
    marketLine: 285.5,
    fairLine: 267.8,
    edgePct: -6.2,
    confidence: 0.79,
    lastUpdated: new Date().toISOString(),
    overUnder: 'under',
    recommendation: 'under'
  },
  {
    id: 'uga_bama_milroe_rush_yards',
    gameId: 'uga-alabama-20250927',
    playerId: 'cfb_jalen_milroe',
    playerName: 'Jalen Milroe',
    team: 'Alabama',
    market: 'Rushing Yards',
    marketLine: 67.5,
    fairLine: 82.4,
    edgePct: 22.1,
    confidence: 0.94,
    lastUpdated: new Date().toISOString(),
    overUnder: 'over',
    recommendation: 'strong_over'
  },
  {
    id: 'uga_bama_williams_rec_yards',
    gameId: 'uga-alabama-20250927',
    playerId: 'cfb_ryan_williams',
    playerName: 'Ryan Williams',
    team: 'Alabama',
    market: 'Receiving Yards',
    marketLine: 78.5,
    fairLine: 69.3,
    edgePct: -11.7,
    confidence: 0.84,
    lastUpdated: new Date().toISOString(),
    overUnder: 'under',
    recommendation: 'under'
  },
  
  // GT vs Wake Forest - Ryan Puglisi props
  {
    id: 'gt_wf_puglisi_pass_yards',
    gameId: 'gt-wake-forest-20250927',
    playerId: 'cfb_ryan_puglisi',
    playerName: 'Ryan Puglisi',
    team: 'Georgia Tech',
    market: 'Passing Yards',
    marketLine: 195.5,
    fairLine: 218.7,
    edgePct: 11.9,
    confidence: 0.73,
    lastUpdated: new Date().toISOString(),
    overUnder: 'over',
    recommendation: 'over'
  },
  {
    id: 'gt_wf_puglisi_pass_tds',
    gameId: 'gt-wake-forest-20250927',
    playerId: 'cfb_ryan_puglisi',
    playerName: 'Ryan Puglisi',
    team: 'Georgia Tech',
    market: 'Passing Touchdowns',
    marketLine: 1.5,
    fairLine: 1.3,
    edgePct: -13.3,
    confidence: 0.66,
    lastUpdated: new Date().toISOString(),
    overUnder: 'under',
    recommendation: 'under'
  },
  {
    id: 'gt_wf_jamal_haynes_rush_yards',
    gameId: 'gt-wake-forest-20250927',
    playerId: 'cfb_jamal_haynes',
    playerName: 'Jamal Haynes',
    team: 'Georgia Tech',
    market: 'Rushing Yards',
    marketLine: 76.5,
    fairLine: 91.2,
    edgePct: 19.2,
    confidence: 0.88,
    lastUpdated: new Date().toISOString(),
    overUnder: 'over',
    recommendation: 'strong_over'
  }
];

// Helper functions
export function getPropsByGame(gameId: string): DemoPropLine[] {
  return DEMO_PROP_LINES.filter(prop => prop.gameId === gameId);
}

export function getPropsByPlayer(playerId: string): DemoPropLine[] {
  return DEMO_PROP_LINES.filter(prop => prop.playerId === playerId);
}

export function getTopEdges(minEdge = 10): DemoPropLine[] {
  return DEMO_PROP_LINES
    .filter(prop => Math.abs(prop.edgePct) >= minEdge)
    .sort((a, b) => Math.abs(b.edgePct) - Math.abs(a.edgePct));
}

export function getPropById(propId: string): DemoPropLine | null {
  return DEMO_PROP_LINES.find(prop => prop.id === propId) || null;
}