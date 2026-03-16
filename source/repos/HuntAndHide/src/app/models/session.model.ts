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
  heartbeatAt: number;
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
  roundTimeSeconds: 120, // this get's overwritten in game-loop.service by roundDurationMs, but serves as a default. Do not alter time here.
  maxRounds: 3,
  mapId: 'jungle',
};

// ── Auto-scaling constants ───────────────────────────────────

/** Maximum players per session before overflow to a new one. */
export const MAX_PLAYERS_PER_SESSION = 10;

// ── Round-end MVP ───────────────────────────────────────

export type RoundWinner = 'hunters' | 'hiders' | null;

export interface RoundMvp {
  displayName: string;
  role: 'hunter' | 'hider';
  score: number;
  catches: number;
  survived: boolean;
}
