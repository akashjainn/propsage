export type NFLContext = { season: string; week: number };

export function getNFLContext(): NFLContext {
  const season = process.env.NEXT_PUBLIC_NFL_SEASON || "2025REG";
  const weekRaw = process.env.NEXT_PUBLIC_NFL_WEEK || "5";
  const week = Number(weekRaw);
  return {
    season,
    week: Number.isFinite(week) ? week : 5,
  };
}
