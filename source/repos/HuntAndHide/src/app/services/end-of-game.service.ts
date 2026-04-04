import { inject, Injectable } from '@angular/core';
import { GameLoopService } from './game-loop.service';
import { LeaderboardService } from './leaderboard.service';
import { IdentityService } from './identity.service';
import { ScoreboardEntry } from '../models/scoreboard.model';
import { HiderState, HunterState, PlayerState } from '../models/player.model';
import { RoundWinner } from '../models/session.model';

/**
 * EndOfGameService — single responsibility: capture final round data
 * and persist it to Firestore exactly once.
 *
 * Called on normal game end (results phase) or as a safety net
 * when the component is destroyed mid-game (tab close, navigation, etc.).
 */
@Injectable({ providedIn: 'root' })
export class EndOfGameService {
  private readonly gameLoop = inject(GameLoopService);
  private readonly leaderboard = inject(LeaderboardService);
  private readonly identity = inject(IdentityService);

  private recorded = false;

  /** Build a sorted ScoreboardEntry[] from live game-loop signals. */
  buildScoreboard(): ScoreboardEntry[] {
    const hiderEntries = this.gameLoop.hiders().map(h => this.fromHider(h));
    const hunterEntries = this.gameLoop.hunters().map(h => this.fromHunter(h));
    return [...hiderEntries, ...hunterEntries].sort((a, b) => b.score - a.score);
  }

  /**
   * Persist the local player's result to the Firestore leaderboard.
   * Guaranteed to execute at most once per round (idempotent guard).
   */
  async recordResult(winner: RoundWinner): Promise<void> {
    if (this.recorded) return;
    this.recorded = true;

    const username = this.identity.getUsername();
    if (!username) return;

    const localPlayer = this.gameLoop.getLocalPlayer();
    if (!localPlayer || !winner) return;

    const won = this.didLocalPlayerWin(localPlayer, winner);
    await this.writeToLeaderboard(username, localPlayer.score, won, localPlayer.role);
  }

  /** Safety-net call: persist if game was in progress but never reached results. */
  async recordIfNeeded(winner: RoundWinner): Promise<void> {
    if (this.recorded) return;
    if (this.gameLoop.phase() === 'lobby') return;
    await this.recordResult(winner ?? this.inferWinner());
  }

  reset(): void {
    this.recorded = false;
  }

  private fromHider(h: HiderState): ScoreboardEntry {
    return {
      uid: h.uid,
      displayName: h.displayName,
      role: 'hider',
      animal: h.animal,
      score: h.score,
      isAlive: h.isAlive,
      isCpu: h.isCpu,
      catches: 0,
      isCaught: h.isCaught,
    };
  }

  private fromHunter(h: HunterState): ScoreboardEntry {
    return {
      uid: h.uid,
      displayName: h.displayName,
      role: 'hunter',
      animal: h.animal,
      score: h.score,
      isAlive: h.isAlive,
      isCpu: h.isCpu,
      catches: h.kills,
      isCaught: false,
    };
  }

  private didLocalPlayerWin(player: PlayerState, winner: RoundWinner): boolean {
    return winner === (player.role === 'hider' ? 'hiders' : 'hunters');
  }

  private inferWinner(): RoundWinner {
    const aliveHiders = this.gameLoop.hiders().filter(h => h.isAlive && !h.isCaught);
    return aliveHiders.length > 0 ? 'hiders' : 'hunters';
  }

  private async writeToLeaderboard(
    username: string,
    score: number,
    won: boolean,
    role: 'hider' | 'hunter',
  ): Promise<void> {
    try {
      await this.leaderboard.recordGameResult(username, score, won, role);
    } catch (err) {
      console.error('[EndOfGame] Failed to record leaderboard result:', err);
    }
  }
}
