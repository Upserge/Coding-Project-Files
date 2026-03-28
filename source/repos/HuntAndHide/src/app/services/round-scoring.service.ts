import { Injectable, signal } from '@angular/core';
import { RoundMvp, RoundMvps, RoundWinner } from '../models/session.model';
import { HiderState, HunterState, PlayerState, Vec3 } from '../models/player.model';

/**
 * RoundScoringService tracks per-round stats:
 * survival times, catch counts, snapshots for scoreboard,
 * and MVP computation at round end.
 */
@Injectable({ providedIn: 'root' })
export class RoundScoringService {
  readonly roundMvp = signal<RoundMvp | null>(null);
  readonly roundMvps = signal<RoundMvps | null>(null);
  readonly survivalBonusPositions = signal<Vec3[]>([]);

  private readonly survivalIntervalS = 30;
  private readonly survivalBonusPoints = 50;
  private survivalAccumulatorS = 0;
  private survivalTimes = new Map<string, number>();
  private catchCounts = new Map<string, number>();
  private roundHunterSnapshots = new Map<string, { displayName: string; score: number; catches: number }>();
  private roundHiderSnapshots = new Map<string, { displayName: string; score: number; survived: boolean }>();

  getCatchCount(uid: string): number {
    return this.catchCounts.get(uid) ?? 0;
  }

  incrementCatch(uid: string): void {
    this.catchCounts.set(uid, (this.catchCounts.get(uid) ?? 0) + 1);
  }

  trackSurvivalTimes(aliveHiders: HiderState[], delta: number): void {
    for (const hider of aliveHiders) {
      if (hider.isHiding) continue;
      this.survivalTimes.set(hider.uid, (this.survivalTimes.get(hider.uid) ?? 0) + delta);
    }
  }

  /** Returns true and resets accumulator when a survival bonus is due. */
  tickSurvivalAccumulator(delta: number): boolean {
    this.survivalAccumulatorS += delta;
    if (this.survivalAccumulatorS < this.survivalIntervalS) return false;
    this.survivalAccumulatorS -= this.survivalIntervalS;
    return true;
  }

  awardSurvivalBonus(
    hiders: HiderState[],
    aliveHiders: HiderState[],
  ): HiderState[] {
    const positions: Vec3[] = [];
    const updated = hiders.map(h => {
      const eligible = aliveHiders.some(a => a.uid === h.uid) && !h.isHiding;
      if (!eligible) return h;
      positions.push({ ...h.position });
      return { ...h, score: h.score + this.survivalBonusPoints };
    });
    this.survivalBonusPositions.set(positions);
    return updated;
  }

  snapshotHider(hider: HiderState): void {
    this.roundHiderSnapshots.set(hider.uid, {
      displayName: hider.displayName,
      score: hider.score,
      survived: hider.isAlive && !hider.isCaught,
    });
  }

  snapshotHiderOnConvert(hider: HiderState): void {
    this.roundHiderSnapshots.set(hider.uid, {
      displayName: hider.displayName,
      score: hider.score,
      survived: false,
    });
  }

  snapshotHunter(hunter: HunterState): void {
    this.roundHunterSnapshots.set(hunter.uid, {
      displayName: hunter.displayName,
      score: hunter.score,
      catches: this.catchCounts.get(hunter.uid) ?? hunter.kills,
    });
  }

  computeRoundMvp(
    hiders: HiderState[],
    hunters: HunterState[],
    winner: RoundWinner,
  ): void {
    const allPlayers: PlayerState[] = [...hiders, ...hunters];
    if (allPlayers.length === 0) {
      this.roundMvp.set(null);
      this.roundMvps.set(null);
      return;
    }

    const top = winner === 'hiders'
      ? this.pickLongestSurvivor(allPlayers)
      : this.pickTopScorer(allPlayers);

    const catches = this.catchCounts.get(top.uid) ?? 0;
    const survived = top.role === 'hider' ? top.isAlive : true;

    this.roundMvp.set({ displayName: top.displayName, role: top.role, score: top.score, catches, survived });
    this.roundMvps.set({ hunter: this.computeMvpHunter(), hider: this.computeMvpHider(), winner });
  }

  reset(): void {
    this.catchCounts.clear();
    this.survivalAccumulatorS = 0;
    this.survivalTimes.clear();
    this.roundHunterSnapshots.clear();
    this.roundHiderSnapshots.clear();
    this.roundMvp.set(null);
  }

  private computeMvpHunter(): RoundMvps['hunter'] {
    const hunters = [...this.roundHunterSnapshots.values()];
    if (hunters.length === 0) return null;
    return hunters.sort((a, b) => b.catches - a.catches || b.score - a.score)[0];
  }

  private computeMvpHider(): RoundMvps['hider'] {
    const hiders = [...this.roundHiderSnapshots.values()];
    if (hiders.length === 0) return null;
    return hiders.sort((a, b) => b.score - a.score)[0];
  }

  private pickLongestSurvivor(players: PlayerState[]): PlayerState {
    const hiders = players.filter(p => p.role === 'hider');
    if (hiders.length === 0) return this.pickTopScorer(players);
    return [...hiders].sort((a, b) =>
      (this.survivalTimes.get(b.uid) ?? 0) - (this.survivalTimes.get(a.uid) ?? 0),
    )[0];
  }

  private pickTopScorer(players: PlayerState[]): PlayerState {
    return [...players].sort((a, b) => b.score - a.score)[0];
  }
}
