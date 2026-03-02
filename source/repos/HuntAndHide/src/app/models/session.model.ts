/** Session and matchmaking types. Imports only from player.model. */

import { PlayerState } from './player.model';

// ── Game phases ──────────────────────────────────────────────

export type GamePhase = 'lobby' | 'hunting' | 'results';

// ── Session document (mirrors Firestore shape) ───────────────

export interface GameSession {
  id?: string;
  hostUid: string;
  phase: GamePhase;
  players: Record<string, PlayerState>;
  hiderCount: number;
  hunterCount: number;
  roundTimeSeconds: number;
  currentRound: number;
  maxRounds: number;
  createdAt: number;
  updatedAt: number;
}

// ── Session configuration ────────────────────────────────────

export interface SessionConfig {
  maxPlayers: number;
  hiderSlots: number;
  hunterSlots: number;
  roundTimeSeconds: number;
  maxRounds: number;
  mapId: string;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxPlayers: 10,
  hiderSlots: 7,
  hunterSlots: 3,
  roundTimeSeconds: 120,
  maxRounds: 3,
  mapId: 'jungle',
};

// ── Auto-scaling constants ───────────────────────────────────

/** Maximum players per session before overflow to a new one. */
export const MAX_PLAYERS_PER_SESSION = 10;
