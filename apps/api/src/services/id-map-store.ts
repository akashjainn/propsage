type MapKey = string

const gameMap = new Map<MapKey, string>() // nflGameId -> ocSportEventId
const teamMap = new Map<MapKey, string>() // nflTeamId -> ocTeamId
const playerMap = new Map<MapKey, string>() // nflPlayerId -> ocPlayerId

export const idMapStore = {
  getSportEventForNflGame(nflGameId: string) { return gameMap.get(nflGameId) || null },
  setSportEventForNflGame(nflGameId: string, ocId: string) { gameMap.set(nflGameId, ocId) },
  getOcTeamId(nflTeamId: string) { return teamMap.get(nflTeamId) || null },
  setOcTeamId(nflTeamId: string, ocTeamId: string) { teamMap.set(nflTeamId, ocTeamId) },
  getOcPlayerId(nflPlayerId: string) { return playerMap.get(nflPlayerId) || null },
  setOcPlayerId(nflPlayerId: string, ocPlayerId: string) { playerMap.set(nflPlayerId, ocPlayerId) },
}
