// MARKET_SPECS: Deterministic mapping from marketKey to stat delta logic
// Each MarketSpec defines how to extract deltas from a PBP event
import { PbP, MarketKey } from './canonical-model';

export type MarketDelta = { playerId: string; market: MarketKey; delta: number; evidence?: any; book?: string };

export type MarketSpec = {
  affects: MarketKey[];
  deltas: (play: PbP) => MarketDelta[];
};

export const MARKET_SPECS: Record<MarketKey, MarketSpec> = {
  passYds: {
    affects: ['passYds'],
    deltas: (play) => {
      if (play.eventType === 'pass_complete' && play.passerId && typeof play.yards === 'number') {
        return [{ playerId: play.passerId, market: 'passYds', delta: play.yards }];
      }
      return [];
    },
  },
  passTD: {
    affects: ['passTD'],
    deltas: (play) => {
      if (play.eventType === 'pass_touchdown' && play.passerId) {
        return [{ playerId: play.passerId, market: 'passTD', delta: 1 }];
      }
      return [];
    },
  },
  rushYds: {
    affects: ['rushYds'],
    deltas: (play) => {
      if (play.eventType === 'rush' && play.rusherId && typeof play.yards === 'number') {
        return [{ playerId: play.rusherId, market: 'rushYds', delta: play.yards }];
      }
      return [];
    },
  },
  recYds: {
    affects: ['recYds'],
    deltas: (play) => {
      if (play.eventType === 'pass_complete' && play.receiverId && typeof play.yards === 'number') {
        return [{ playerId: play.receiverId, market: 'recYds', delta: play.yards }];
      }
      return [];
    },
  },
  receptions: {
    affects: ['receptions'],
    deltas: (play) => {
      if (play.eventType === 'pass_complete' && play.receiverId) {
        return [{ playerId: play.receiverId, market: 'receptions', delta: 1 }];
      }
      return [];
    },
  },
  rushRecYds: {
    affects: ['rushRecYds'],
    deltas: (play) => {
      const deltas: MarketDelta[] = [];
      if (play.eventType === 'rush' && play.rusherId && typeof play.yards === 'number') {
        deltas.push({ playerId: play.rusherId, market: 'rushRecYds', delta: play.yards });
      }
      if (play.eventType === 'pass_complete' && play.receiverId && typeof play.yards === 'number') {
        deltas.push({ playerId: play.receiverId, market: 'rushRecYds', delta: play.yards });
      }
      return deltas;
    },
  },
  targets: {
    affects: ['targets'],
    deltas: (play) => {
      if ((play.eventType === 'pass_complete' || play.eventType === 'pass_incomplete') && play.receiverId) {
        return [{ playerId: play.receiverId, market: 'targets', delta: 1 }];
      }
      return [];
    },
  },
  passComp: {
    affects: ['passComp'],
    deltas: (play) => {
      if (play.eventType === 'pass_complete' && play.passerId) {
        return [{ playerId: play.passerId, market: 'passComp', delta: 1 }];
      }
      return [];
    },
  },
  passAtt: {
    affects: ['passAtt'],
    deltas: (play) => {
      if ((play.eventType === 'pass_complete' || play.eventType === 'pass_incomplete') && play.passerId) {
        return [{ playerId: play.passerId, market: 'passAtt', delta: 1 }];
      }
      return [];
    },
  },
  rushAtt: {
    affects: ['rushAtt'],
    deltas: (play) => {
      if (play.eventType === 'rush' && play.rusherId) {
        return [{ playerId: play.rusherId, market: 'rushAtt', delta: 1 }];
      }
      return [];
    },
  },
  longestRec: {
    affects: ['longestRec'],
    deltas: (play) => {
      if (play.eventType === 'pass_complete' && play.receiverId && typeof play.yards === 'number') {
        return [{ playerId: play.receiverId, market: 'longestRec', delta: play.yards }];
      }
      return [];
    },
  },
  longestRush: {
    affects: ['longestRush'],
    deltas: (play) => {
      if (play.eventType === 'rush' && play.rusherId && typeof play.yards === 'number') {
        return [{ playerId: play.rusherId, market: 'longestRush', delta: play.yards }];
      }
      return [];
    },
  },
};
