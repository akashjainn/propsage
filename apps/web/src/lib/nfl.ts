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

const BaseResponseZ = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    data: z.array(schema).optional(),
    status: z.enum(["ok", "error"]).optional(),
    error: z.any().optional(),
  });

const api = (path: string) => {
  const base = process.env.DATA_API_URL || process.env.NEXT_PUBLIC_DATA_API_URL || "";
  return `${base}${path}`;
};

export async function fetchNFLProps(): Promise<{ data?: NFLProp[]; status: "loading" | "ok" | "error"; error?: any; }> {
  try {
   const base = process.env.DATA_API_URL || process.env.NEXT_PUBLIC_DATA_API_URL;
   if (!base) {
     // Graceful empty for local dev without API configured
     logger.info("nfl-props-fetch-skipped", { reason: "No DATA_API_URL configured" });
     return { data: [], status: "ok" };
   }
    const { season, week } = getNFLContext();
    const url = api(`/nfl/props?season=${encodeURIComponent(season)}&week=${encodeURIComponent(String(week))}`);
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`fetchNFLProps failed: ${res.status}`);
    const json = await res.json();
    // Accept either plain array or wrapped {data}
    const arr = Array.isArray(json) ? json : json?.data;
    const parsed = z.array(NFLPropZ).safeParse(arr ?? []);
    if (!parsed.success) {
      logger.error("nfl-props-parse-failed", { issues: parsed.error.issues });
      return { data: [], status: "error", error: parsed.error };
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

    if (!base) {
      // Local, static Week fixture when no external clips API is configured
      try {
        const local = (await import("../data/week5_clips.json")).default as Clip[];
        return { data: local, status: "ok" };
      } catch {
        return { data: [], status: "ok" };
      }
    }
    const res = await fetch(`${base}/nfl/clips?season=${encodeURIComponent(season)}&week=${encodeURIComponent(String(week))}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`fetchClipsForWeek failed: ${res.status}`);
    const json = await res.json();
    const arr = Array.isArray(json) ? json : json?.data;
    const parsed = z.array(ClipZ).safeParse(arr ?? []);
    if (!parsed.success) {
      logger.error("clips-parse-failed", { issues: parsed.error.issues });
      return { data: [], status: "error", error: parsed.error };
    }
    return { data: parsed.data, status: "ok" };
  } catch (e) {
    logger.error("clips-fetch-failed", { e });
    return { data: [], status: "error", error: e };
  }
}
