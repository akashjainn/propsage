// Interval join and stat progress logic for prop/play alignment
import { PropLine, PbP, StatProgress, MarketKey } from './canonical-model';
import { MARKET_SPECS } from './market-specs';

// Choose the current line snapshot for a play
export function chooseLineSnapshot(snapshots: PropLine[], playTime: Date): PropLine | undefined {
  // snapshots must be pre-sorted ASC by snapshotAt
  let chosen: PropLine | undefined;
  for (const s of snapshots) {
    if (new Date(s.snapshotAt) <= playTime) chosen = s; else break;
  }
  return chosen;
}

// Apply a play to update stat progress and record impacts
export function applyPlay(
  play: PbP,
  state: Map<string, StatProgress>,
  linesIndex: Map<string, PropLine[]>,
  recordImpact: (play: PbP, d: any, line: PropLine) => void
) {
  // Compute deltas for all relevant markets
  const deltas = Object.values(MARKET_SPECS).flatMap(spec => spec.deltas(play));
  for (const d of deltas) {
    const key = `${play.gameId}:${d.playerId}:${d.market}`;
    const cur = state.get(key) ?? { id: key, gameId: play.gameId, playerId: d.playerId, marketKey: d.market, current: 0, updatedAt: new Date().toISOString() };
    cur.current += d.delta;
    cur.lastPlayId = play.id;
    cur.updatedAt = new Date().toISOString();
    state.set(key, cur);

    const snaps = linesIndex.get(`${play.gameId}:${d.playerId}:${d.market}:${d.book || ''}`) ?? [];
    const line = chooseLineSnapshot(snaps, new Date(play.realTimeUtc));
    if (line) recordImpact(play, d, line);
  }
}
