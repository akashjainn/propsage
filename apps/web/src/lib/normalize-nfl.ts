export type UiGame = {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  scores?: { home: number; away: number };
  books?: UiBookOdds[];
};

export type UiBookOdds = {
  book: string;
  spreadHome?: number;
  spreadAway?: number;
  moneylineHome?: number;
  moneylineAway?: number;
  total?: number;
  updatedAt?: string;
};

export type UiProp = {
  id: string;
  gameId: number;
  playerId: string;
  player: string;
  team?: string;
  market: string;
  line: number;
  priceOver?: number;
  priceUnder?: number;
  book: string;
  updatedAt?: string;
};

export function fromSportsDataIOGame(g: any, oddsByGame?: Record<number, any[]>): UiGame {
  return {
    id: g.GameID,
    date: g.Date,
    homeTeam: g.HomeTeam,
    awayTeam: g.AwayTeam,
    status: g.Status,
    scores: (g.HomeScore ?? g.AwayScore) != null ? { home: g.HomeScore ?? 0, away: g.AwayScore ?? 0 } : undefined,
    books: (oddsByGame?.[g.GameID] ?? []).map(fromSportsDataIOOdds),
  };
}

export function fromSportsDataIOOdds(o: any): UiBookOdds {
  return {
    book: o.Sportsbook ?? o.SportsbookName ?? 'Unknown',
    spreadHome: o.HomePointSpread ?? o.PointSpreadHome,
    spreadAway: o.AwayPointSpread ?? o.PointSpreadAway,
    moneylineHome: o.MoneyLineHome ?? o.HomeMoneyLine,
    moneylineAway: o.MoneyLineAway ?? o.AwayMoneyLine,
    total: o.OverUnder ?? o.TotalOverUnder,
    updatedAt: o.Updated ?? o.LastSeen,
  };
}

export function fromSportsDataIOProp(p: any, gameId: number): UiProp {
  return {
    id: `${gameId}:${p.PlayerID}:${p.Name}:${p.Sportsbook}`,
    gameId,
    playerId: String(p.PlayerID ?? p.GlobalPlayerID ?? ''),
    player: p.Name ?? p.PlayerName ?? 'Unknown',
    team: p.Team ?? p.PlayerTeam ?? undefined,
    market: p.BetName ?? p.Market ?? 'Unknown',
    line: Number(p.Value ?? p.Line ?? 0),
    priceOver: p.OverPayout ?? p.OverPrice ?? undefined,
    priceUnder: p.UnderPayout ?? p.UnderPrice ?? undefined,
    book: p.Sportsbook ?? p.SportsbookName ?? 'Unknown',
    updatedAt: p.Updated ?? undefined,
  };
}
