export function normalizePropLabel(input: string | null | undefined) {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s/+-]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}
const ALIASES: Record<string, string> = {
  passing_yards: 'pass_yds',
  rushing_yards: 'rush_yds',
  receiving_yards: 'rec_yds',
  passing_tds: 'pass_tds',
  longest_completion: 'longest_completion'
};
export function normalizePropForFocus(label: string) {
  const slug = normalizePropLabel(label);
  return ALIASES[slug] ?? slug;
}

// Additional normalization functions for NFL clip/prop matching
// Simple diacritics removal fallback (no external package needed)
function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const MARKET_ALIASES: Record<string, string> = {
  "pass yds": "Passing Yards",
  "passing yds": "Passing Yards",
  "passing yards": "Passing Yards",
  "rush yds": "Rushing Yards",
  "rushing yds": "Rushing Yards",
  "rushing yards": "Rushing Yards",
  "rec yds": "Receiving Yards",
  "receiving yds": "Receiving Yards",
  "receiving yards": "Receiving Yards",
  "pass tds": "Passing TDs",
  "passing tds": "Passing TDs",
};

export function normalizeMarket(input: string): string {
  const key = input.trim().toLowerCase();
  return MARKET_ALIASES[key] ?? input.replace(/\s+/g, " ").trim();
}

export function normalizeLine(n: number | string | undefined | null): number {
  const num = typeof n === "string" ? parseFloat(n) : n ?? 0;
  // standardize to one decimal (book line precision)
  return Math.round((num + Number.EPSILON) * 10) / 10;
}

export function normalizePlayerName(name?: string): string {
  if (!name) return "";
  const s = removeDiacritics(name).toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  return s;
}

export function isLineWithinTolerance(a: number, b: number, tol: number): boolean {
  return Math.abs(normalizeLine(a) - normalizeLine(b)) <= tol;
}