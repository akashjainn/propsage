// Canonical Data Model for Prop/Play/Video Alignment
// This file defines the core types and normalization utilities for the system.

export type MarketKey =
  | 'passYds' | 'passTD' | 'rushYds' | 'recYds' | 'receptions'
  | 'rushRecYds' | 'targets' | 'passComp' | 'passAtt' | 'rushAtt' | 'longestRec' | 'longestRush';

export interface PlayerIdMap {
  sportsdataioPlayerId: string;
  msfPlayerId?: string;
  gsisId?: string;
  fullName: string;
  team: string;
  pos: string;
}

export interface GameIdMap {
  gameId: number; // SportsDataIO GameID
  season: string;
  week: number;
  kickoffUtc: string;
}

export interface BookIdMap {
  slug: string; // e.g., 'draftkings', 'fanduel'
  vendorNames: string[];
}

export interface PropLine {
  id: string; // `${gameId}:${playerId}:${marketKey}:${book}:${snapshotAt}`
  gameId: number;
  playerId: string;
  marketKey: MarketKey;
  book: string;
  line: number;
  overPrice?: number;
  underPrice?: number;
  snapshotAt: string; // ISO
}

export interface PbP {
  id: string; // `${gameId}:${seq}`
  gameId: number;
  clock: string; // "Q2 03:09"
  realTimeUtc: string;
  eventType: string;
  offenseId?: string;
  defenseId?: string;
  yards?: number;
  passerId?: string;
  rusherId?: string;
  receiverId?: string;
  raw?: any;
}

export interface StatProgress {
  id: string; // `${gameId}:${playerId}:${marketKey}`
  gameId: number;
  playerId: string;
  marketKey: MarketKey;
  current: number;
  lastPlayId?: string;
  updatedAt: string;
}

export interface EvidenceLink {
  id: string; // `${pbpId}:${playerId}:${marketKey}`
  pbpId: string;
  playerId: string;
  marketKey: MarketKey;
  clipUrl?: string;
  note?: string;
}

export interface MarketAlias {
  vendorName: string;
  marketKey: MarketKey;
}

// Normalization utilities
export function normalizeMarketName(name: string): MarketKey | undefined {
  const map: Record<string, MarketKey> = {
    'Passing Yards': 'passYds',
    'Pass Yds': 'passYds',
    'Player Passing Yards': 'passYds',
    'Passing Touchdowns': 'passTD',
    'Rushing Yards': 'rushYds',
    'Receiving Yards': 'recYds',
    'Receptions': 'receptions',
    // ...add all vendor aliases
  };
  return map[name.trim()] as MarketKey | undefined;
}

export function normalizeBookName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizePlayerId(id: string): string {
  return id.trim();
}

export function normalizeGameId(id: number): number {
  return id;
}
