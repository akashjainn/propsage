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
};
export function normalizePropForFocus(label: string) {
  const slug = normalizePropLabel(label);
  return ALIASES[slug] ?? slug;
}