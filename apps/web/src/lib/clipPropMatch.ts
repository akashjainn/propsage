import { NFLProp } from "./nfl";
import { normalizeMarket, normalizeLine, normalizePlayerName } from "./normalize";

type Clip = {
  id: string;
  source?: string;
  playerId?: string;
  playerName?: string;
  market?: string;
  line?: number;
  thumbnailUrl?: string;
  playbackUrl?: string;
  createdAt?: string; // ISO
};

type Matched = { prop: NFLProp; clip?: Clip };

const TOL = (() => {
  const raw = process.env.NEXT_PUBLIC_CLIP_MATCH_TOLERANCE;
  const n = raw ? Number(raw) : 0.5;
  return Number.isFinite(n) ? n : 0.5;
})();

export function matchClipsToProps(clips: Clip[], props: NFLProp[]): Matched[] {
  if (!props?.length) return [];
  if (!clips?.length) return props.map((p) => ({ prop: p }));

  const byPlayerMarket = new Map<string, Clip[]>();
  for (const c of clips) {
    const pname = normalizePlayerName(c.playerName);
    const market = c.market ? normalizeMarket(c.market) : "";
    const key = `${pname}|${market}`;
    const arr = byPlayerMarket.get(key) || [];
    arr.push(c);
    byPlayerMarket.set(key, arr);
  }
  // Stable sort per bucket by createdAt desc
  byPlayerMarket.forEach((arr) => {
    arr.sort((a: Clip, b: Clip) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
  });

  const out: Matched[] = [];
  for (const p of props) {
    const pname = normalizePlayerName(p.playerName);
    const market = normalizeMarket(p.market);
    const key = `${pname}|${market}`;
    const bucket = byPlayerMarket.get(key) || [];

    // Prefer same source + line within tolerance, else fallback to closest line
    let best: Clip | undefined;
    let bestDelta = Infinity;
    for (const c of bucket) {
      if (p.source && c.source && p.source !== c.source) continue;
      const cl = c.line ?? NaN;
      if (!Number.isFinite(cl)) continue;
      const delta = Math.abs(normalizeLine(p.line) - normalizeLine(cl));
      if (delta <= TOL && delta < bestDelta) {
        best = c;
        bestDelta = delta;
      }
    }
    if (!best && bucket.length) {
      // No tolerance match; pick closest line anyway
      for (const c of bucket) {
        const cl = c.line ?? NaN;
        if (!Number.isFinite(cl)) continue;
        const delta = Math.abs(normalizeLine(p.line) - normalizeLine(cl));
        if (delta < bestDelta) {
          best = c;
          bestDelta = delta;
        }
      }
    }
    out.push({ prop: p, clip: best });
  }

  return out;
}
