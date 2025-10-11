// Minimal MSF domain types; refine as you map real payloads
export interface MsfTeamRef { id?: string; abbr: string; name?: string }
export interface MsfGame { id: string; season: number; week?: number; startTime?: string; venue?: string; status?: string; home: MsfTeamRef; away: MsfTeamRef; score?: { home: number; away: number }; quarter?: number; clock?: string }
export interface MsfBoxScoreTeam { team: MsfTeamRef; score?: number; stats: Record<string, number> }
export interface MsfBoxScorePlayer { id: string; name: string; team: string; pos?: string; stats: Record<string, number> }
export interface MsfBoxScore { gameId: string; updatedAt: string; teams: MsfBoxScoreTeam[]; players: MsfBoxScorePlayer[] }
export interface MsfPbpPlayer { role: string; id?: string; name?: string; team?: string }
export interface MsfPbpEvent { eid: string; quarter: number; clock: string; down?: number; distance?: number; yardLine?: string; playType?: string; desc?: string; result?: string; yards?: number; airYds?: number; players?: MsfPbpPlayer[] }
export interface MsfInjury { playerId?: string; name?: string; team?: string; status?: string; detail?: string; reportedAt?: string }
