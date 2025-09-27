// SportsDataIO College Football props/odds lightweight client
// Focused on fetching player prop lines for a target game / player (demo-centric)
import { config } from "../config.js";

export interface SportsDataIOPlayerProp {
  PlayerID: number;
  Name: string;
  Team: string;
  Opponent: string;
  Sportsbook: string;
  Updated: string;
  Category: string; // e.g., Passing Yards
  StatType: string; // canonical stat key if provided
  Value?: number; // market line
  OverUnder?: number; // sometimes used
}

export interface NormalizedCfbProp {
  propId: string;
  playerId: string; // internal slug
  playerName: string;
  team?: string;
  position?: string;
  stat: string; // PASS_YDS, PASS_TDS, RUSH_YDS, REC_YDS
  book: string; // sportsbook key
  marketLine: number;
  fairLine: number; // placeholder until model integration
  edgePct: number;  // placeholder (0 for now)
  updatedAt: string;
  source: string; // sportsdataio
}

class SportsDataIOCFBService {
  private apiKey: string;
  private base = "https://api.sportsdata.io/v3/cfb"; // using CFB namespace

  constructor() {
    this.apiKey = process.env.SPORTSDATAIO_API_KEY || ""; // key is demo safe per user message
    if (!this.apiKey) {
      console.warn("⚠️ SportsDataIO key missing - CFB live props disabled (falling back to seeds)");
    }
  }

  private async json<T>(url: string): Promise<T | null> {
    if (!this.apiKey) return null;
    try {
      const res = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": this.apiKey } });
      if (!res.ok) {
        console.warn("SportsDataIO request failed", res.status, res.statusText);
        return null;
      }
      return await res.json() as T;
    } catch (e) {
      console.error("SportsDataIO fetch error", e);
      return null;
    }
  }

  /** Fetch player props for a date (YYYY-MM-DD). We will filter afterwards. */
  async fetchDailyPlayerProps(date: string): Promise<SportsDataIOPlayerProp[]> {
    // NOTE: Endpoint doc reference (NFL example): /odds/json/PlayerPropsByDate/{date}
    // For CFB: Odds endpoints are more limited; some accounts may not have player props.
    // We'll attempt and gracefully fall back.
    const url = `${this.base}/odds/json/PlayerPropsByDate/${date}`;
    const data = await this.json<SportsDataIOPlayerProp[]>(url);
    return data || [];
  }

  normalize(raw: SportsDataIOPlayerProp[]): NormalizedCfbProp[] {
    const rows: NormalizedCfbProp[] = [];
    for (const r of raw) {
      const stat = this.mapCategory(r.Category || r.StatType || "");
      if (!stat) continue;
      const line = r.Value ?? r.OverUnder;
      if (line == null) continue;
      const playerId = this.slug(r.Name);
      rows.push({
        propId: `sdio_${playerId}_${stat}_${this.slug(r.Sportsbook)}`,
        playerId: `cfb_${playerId}`,
        playerName: r.Name,
        team: r.Team,
        position: undefined,
        stat,
        book: r.Sportsbook,
        marketLine: line,
        fairLine: line, // placeholder until modeling available
        edgePct: 0,
        updatedAt: r.Updated || new Date().toISOString(),
        source: "sportsdataio"
      });
    }
    return rows;
  }

  private slug(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/(^_|_$)/g,''); }

  private mapCategory(cat: string): string | null {
    const c = cat.toLowerCase();
    if (c.includes('passing yards')) return 'PASS_YDS';
    if (c.includes('passing touchdowns')) return 'PASS_TDS';
    if (c.includes('rushing yards')) return 'RUSH_YDS';
    if (c.includes('receiving yards')) return 'REC_YDS';
    return null;
  }
}

export const sportsDataIOCFB = new SportsDataIOCFBService();
