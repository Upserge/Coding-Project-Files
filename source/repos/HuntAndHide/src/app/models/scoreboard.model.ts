/** Shared scoreboard entry — used both for live in-game display and post-game Firestore writes. */

import { PlayerRole, AnimalCharacter } from './player.model';

export interface ScoreboardEntry {
  uid: string;
  displayName: string;
  role: PlayerRole;
  animal: AnimalCharacter;
  score: number;
  isAlive: boolean;
  isCpu: boolean;
  /** Hunter-only: number of hiders caught this round. */
  catches: number;
  /** Hider-only: whether the hider was caught. */
  isCaught: boolean;
}
