// Hardcoded college football players for demo reliability
// This ensures key players like Ryan Puglisi show up correctly

export interface CfbPlayerProfile {
  id: string;
  name: string;
  team: string;
  teamShort: string;
  position: string;
  jersey: number;
  class: string;
  height: string;
  weight: number;
  teamColor: string;
  conference: string;
}

export const CFB_PLAYER_REGISTRY: Record<string, CfbPlayerProfile> = {
  'ryan_puglisi': {
    id: 'cfb_ryan_puglisi',
    name: 'Ryan Puglisi',
    team: 'Georgia Tech Yellow Jackets',
    teamShort: 'Georgia Tech',
    position: 'QB',
    jersey: 16,
    class: 'Freshman',
    height: '6-2',
    weight: 205,
    teamColor: 'B3A369',
    conference: 'ACC'
  },
  'gunner_stockton': {
    id: 'cfb_gunner_stockton',
    name: 'Gunner Stockton',
    team: 'Georgia Bulldogs',
    teamShort: 'Georgia',
    position: 'QB',
    jersey: 14,
    class: 'Sophomore',
    height: '6-1',
    weight: 215,
    teamColor: 'BA0C2F',
    conference: 'SEC'
  },
  'trevor_etienne': {
    id: 'cfb_trevor_etienne',
    name: 'Trevor Etienne',
    team: 'Georgia Bulldogs',
    teamShort: 'Georgia',
    position: 'RB',
    jersey: 1,
    class: 'Junior',
    height: '5-9',
    weight: 210,
    teamColor: 'BA0C2F',
    conference: 'SEC'
  },
  'london_humphreys': {
    id: 'cfb_london_humphreys',
    name: 'London Humphreys',
    team: 'Georgia Bulldogs',
    teamShort: 'Georgia',
    position: 'WR',
    jersey: 11,
    class: 'Sophomore',
    height: '6-1',
    weight: 190,
    teamColor: 'BA0C2F',
    conference: 'SEC'
  },
  'jalen_milroe': {
    id: 'cfb_jalen_milroe',
    name: 'Jalen Milroe',
    team: 'Alabama Crimson Tide',
    teamShort: 'Alabama',
    position: 'QB',
    jersey: 4,
    class: 'Junior',
    height: '6-2',
    weight: 220,
    teamColor: '9E1B32',
    conference: 'SEC'
  },
  'justice_haynes': {
    id: 'cfb_justice_haynes',
    name: 'Justice Haynes',
    team: 'Alabama Crimson Tide',
    teamShort: 'Alabama',
    position: 'RB',
    jersey: 22,
    class: 'Sophomore',
    height: '5-10',
    weight: 200,
    teamColor: '9E1B32',
    conference: 'SEC'
  },
  'ryan_williams': {
    id: 'cfb_ryan_williams',
    name: 'Ryan Williams',
    team: 'Alabama Crimson Tide',
    teamShort: 'Alabama',
    position: 'WR',
    jersey: 2,
    class: 'Freshman',
    height: '6-0',
    weight: 178,
    teamColor: '9E1B32',
    conference: 'SEC'
  },
  'haynes_king': {
    id: 'cfb_haynes_king',
    name: 'Haynes King',
    team: 'Georgia Tech Yellow Jackets',
    teamShort: 'Georgia Tech',
    position: 'QB',
    jersey: 10,
    class: 'Senior',
    height: '5-11',
    weight: 195,
    teamColor: 'B3A369',
    conference: 'ACC'
  },
  'jamal_haynes': {
    id: 'cfb_jamal_haynes',
    name: 'Jamal Haynes',
    team: 'Georgia Tech Yellow Jackets',
    teamShort: 'Georgia Tech',
    position: 'RB',
    jersey: 0,
    class: 'Junior',
    height: '5-11',
    weight: 190,
    teamColor: 'B3A369',
    conference: 'ACC'
  },
  'malik_rutherford': {
    id: 'cfb_malik_rutherford',
    name: 'Malik Rutherford',
    team: 'Georgia Tech Yellow Jackets',
    teamShort: 'Georgia Tech',
    position: 'WR',
    jersey: 1,
    class: 'Graduate',
    height: '6-1',
    weight: 190,
    teamColor: 'B3A369',
    conference: 'ACC'
  }
};

// Helper functions for player lookup
export function findPlayerByName(name: string): CfbPlayerProfile | null {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const [key, player] of Object.entries(CFB_PLAYER_REGISTRY)) {
    const playerName = player.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (playerName === normalizedName || normalizedName.includes(playerName) || playerName.includes(normalizedName)) {
      return player;
    }
  }
  
  return null;
}

export function findPlayersByTeam(team: string): CfbPlayerProfile[] {
  const normalizedTeam = team.toLowerCase();
  return Object.values(CFB_PLAYER_REGISTRY).filter(player => 
    player.team.toLowerCase().includes(normalizedTeam) ||
    player.teamShort.toLowerCase().includes(normalizedTeam)
  );
}

export function getAllPlayers(): CfbPlayerProfile[] {
  return Object.values(CFB_PLAYER_REGISTRY);
}