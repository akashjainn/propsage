import { z } from "zod";
import { logger } from "@/utils/logger";
import { getNFLContext } from "./nflConfig";

export const PlayerZ = z.object({
  id: z.string().optional(),
  name: z.string(),
  team: z.string().optional(),
});

export const NFLPropZ = z.object({
  id: z.string(),
  source: z.string().optional(),
  playerId: z.string().optional(),
  playerName: z.string(),
  team: z.string().optional(),
  market: z.string(),
  line: z.number(),
  timestamp: z.string().optional(),
});
export type NFLProp = z.infer<typeof NFLPropZ>;


const GameZ = z.object({
  id: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  kickoff: z.string(),
  status: z.string().optional(),
  homeScore: z.number().optional(),
  awayScore: z.number().optional(),
});
export type NFLGame = z.infer<typeof GameZ>;

function useLocalWeek5(): boolean {
  return (process.env.NEXT_PUBLIC_USE_LOCAL_WEEK5 ?? "").toLowerCase() === "true";
}

async function loadLocal<T>(importer: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await importer();
  } catch (e) {
    logger.warn(`${label}-local-load-failed`, { e });
    return null;
  }
}

const api = (path: string) => {
  const base =
    process.env.DATA_API_URL ||
    process.env.NEXT_PUBLIC_DATA_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "";
  return `${base}${path}`;
};

export async function fetchNFLProps(): Promise<{ data?: NFLProp[]; status: "loading" | "ok" | "error"; error?: any; }> {
  try {
    const { season, week } = getNFLContext();

    // 1) Prefer local fixtures when flag is on
    if (useLocalWeek5()) {
      const local = await loadLocal(() => import("../../../../data/week5_props.json").then(m => m.default), "props");
      if (local) {
        const parsedLocal = z.array(NFLPropZ).safeParse(local);
        if (parsedLocal.success) return { data: parsedLocal.data, status: "ok" };
      }
    }

    // 2) If no API base configured, fall back to local fixtures
    const base = process.env.DATA_API_URL || process.env.NEXT_PUBLIC_DATA_API_URL;
    if (!base) {
      const local = await loadLocal(() => import("../../../../data/week5_props.json").then(m => m.default), "props");
      const parsedLocal = z.array(NFLPropZ).safeParse(local ?? []);
      return parsedLocal.success
        ? { data: parsedLocal.data, status: "ok" }
        : { data: [], status: "error", error: parsedLocal.error };
    }

    // 3) Call API with season/week
    const url = api(`/nfl/props?season=${encodeURIComponent(season)}&week=${encodeURIComponent(String(week))}`);
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      logger.warn("nfl-props-api-not-ok", { status: res.status });
      // Fallback to local
      const local = await loadLocal(() => import("../../../../data/week5_props.json").then(m => m.default), "props");
      const parsedLocal = z.array(NFLPropZ).safeParse(local ?? []);
      return parsedLocal.success
        ? { data: parsedLocal.data, status: "ok" }
        : { data: [], status: "error", error: parsedLocal.error };
    }
    const json = await res.json();
    const arr = Array.isArray(json) ? json : json?.data;
    const parsed = z.array(NFLPropZ).safeParse(arr ?? []);
    if (!parsed.success || parsed.data.length === 0) {
      logger.warn("nfl-props-empty-or-parse-failed", { issues: (!parsed.success && parsed.error.issues) || "empty" });
      // Fallback to local
      const local = await loadLocal(() => import("../../../../data/week5_props.json").then(m => m.default), "props");
      const parsedLocal = z.array(NFLPropZ).safeParse(local ?? []);
      return parsedLocal.success
        ? { data: parsedLocal.data, status: "ok" }
        : { data: [], status: "error", error: parsedLocal.error };
    }
    return { data: parsed.data, status: "ok" };
  } catch (e) {
    logger.error("nfl-props-fetch-failed", { e });
    return { data: [], status: "error", error: e };
  }
}

const ClipZ = z.object({
  id: z.string(),
  source: z.string().optional(),
  playerId: z.string().optional(),
  playerName: z.string().optional(),
  market: z.string().optional(),
  line: z.number().optional(),
  thumbnailUrl: z.string().url().optional(),
  playbackUrl: z.string().url().optional(),
  createdAt: z.string().optional(),
});
export type Clip = z.infer<typeof ClipZ>;

export async function fetchClipsForWeek(): Promise<{ data?: Clip[]; status: "loading" | "ok" | "error"; error?: any; }> {
  try {
    const base = process.env.CLIPS_API_URL || process.env.NEXT_PUBLIC_CLIPS_API_URL || "";
    const { season, week } = getNFLContext();

    // Prefer dynamic evidence built from props via our local API route.
    // This route proxies to the backend /nfl/evidence/props and matches by player/market.
    const res = await fetch(`/api/nfl/evidence/for-props?season=${encodeURIComponent(season)}&week=${encodeURIComponent(String(week))}`,
      { next: { revalidate: 60 } }
    )

    if (!res.ok) {
      logger.warn("clips-api-not-ok", { status: res.status })
      // Fallback to local
      const local = await loadLocal(() => import("../data/week5_clips.json").then(m => m.default), "clips")
      const parsedLocal = z.array(ClipZ).safeParse(local ?? [])
      return parsedLocal.success
        ? { data: parsedLocal.data, status: "ok" }
        : { data: [], status: "error", error: parsedLocal.error }
    }

    const json = await res.json()
    const arr = Array.isArray(json) ? json : json?.clips
    const parsed = z.array(ClipZ).safeParse(arr ?? [])
    if (!parsed.success || parsed.data.length === 0) {
      logger.warn("clips-empty-or-parse-failed", { issues: (!parsed.success && parsed.error.issues) || "empty" })
      const local = await loadLocal(() => import("../data/week5_clips.json").then(m => m.default), "clips")
      const parsedLocal = z.array(ClipZ).safeParse(local ?? [])
      return parsedLocal.success
        ? { data: parsedLocal.data, status: "ok" }
        : { data: [], status: "error", error: parsedLocal.error }
    }
    return { data: parsed.data, status: "ok" }
  } catch (e) {
    logger.error("clips-fetch-failed", { e });
    return { data: [], status: "error", error: e };
  }
}

export async function fetchGamesForWeek(): Promise<{ data?: NFLGame[]; status: "loading" | "ok" | "error"; error?: any; }> {
  try {
    const { season, week } = getNFLContext();

    // Prefer local when flag is on
    if (useLocalWeek5()) {
      const local = await loadLocal(() => import("../../../../data/week5_games.json").then(m => m.default), "games");
      const parsedLocal = z.array(GameZ).safeParse(local ?? []);
      return parsedLocal.success
        ? { data: parsedLocal.data, status: "ok" }
        : { data: [], status: "error", error: parsedLocal.error };
    }

    const base = process.env.DATA_API_URL || process.env.NEXT_PUBLIC_DATA_API_URL;
    if (!base) {
      const local = await loadLocal(() => import("../../../../data/week5_games.json").then(m => m.default), "games");
      const parsedLocal = z.array(GameZ).safeParse(local ?? []);
      return parsedLocal.success
        ? { data: parsedLocal.data, status: "ok" }
        : { data: [], status: "error", error: parsedLocal.error };
    }

    const res = await fetch(api(`/nfl/games?season=${encodeURIComponent(season)}&week=${encodeURIComponent(String(week))}`), {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      logger.warn("games-api-not-ok", { status: res.status });
      const local = await loadLocal(() => import("../../../../data/week5_games.json").then(m => m.default), "games");
      const parsedLocal = z.array(GameZ).safeParse(local ?? []);
      return parsedLocal.success
        ? { data: parsedLocal.data, status: "ok" }
        : { data: [], status: "error", error: parsedLocal.error };
    }
    const json = await res.json();
    let arr: any[] | undefined;
    if (Array.isArray(json)) arr = json;
    else if (Array.isArray(json?.data)) arr = json.data;
    else if (Array.isArray(json?.games)) {
      // Transform live API shape -> GameZ shape
      arr = json.games.map((g: any) => ({
        id: String(g.id),
        homeTeam: g.home?.abbreviation || g.home?.alias || g.homeTeam,
        awayTeam: g.away?.abbreviation || g.away?.alias || g.awayTeam,
        kickoff: g.date || g.kickoff,
        status: g.status,
        homeScore: g.home?.score,
        awayScore: g.away?.score,
      }))
    } else arr = []

    const parsed = z.array(GameZ).safeParse(arr ?? []);
    if (!parsed.success || parsed.data.length === 0) {
      logger.warn("games-empty-or-parse-failed", { issues: (!parsed.success && parsed.error.issues) || "empty" });
      const local = await loadLocal(() => import("../../../../data/week5_games.json").then(m => m.default), "games");
      const parsedLocal = z.array(GameZ).safeParse(local ?? []);
      return parsedLocal.success
        ? { data: parsedLocal.data, status: "ok" }
        : { data: [], status: "error", error: parsedLocal.error };
    }
    return { data: parsed.data, status: "ok" };
  } catch (e) {
    logger.error("games-fetch-failed", { e });
    return { data: [], status: "error", error: e };
  }
}
