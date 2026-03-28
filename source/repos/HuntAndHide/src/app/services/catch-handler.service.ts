import { inject, Injectable, signal } from '@angular/core';
import { HiderState, HunterState, Vec3 } from '../models/player.model';
import { HunterService } from './hunter.service';
import { HidingService } from './hiding.service';
import { RoundScoringService } from './round-scoring.service';

/**
 * CatchHandlerService detects hunter–hider catches,
 * manages the short animation window before conversion,
 * and converts caught hiders into hunters.
 */
@Injectable({ providedIn: 'root' })
export class CatchHandlerService {
  private readonly hunterService = inject(HunterService);
  private readonly hidingService = inject(HidingService);
  private readonly scoring = inject(RoundScoringService);

  readonly catchFeed = signal<{ hunterName: string; hiderName: string; time: number }[]>([]);
  readonly catchScorePositions = signal<Vec3[]>([]);

  private readonly catchAnimDuration = 0.6;
  private pendingCatches = new Map<string, number>();

  checkCatches(
    currentHunters: HunterState[],
    currentHiders: HiderState[],
  ): { updatedHunters: HunterState[]; updatedHiders: HiderState[] } | null {
    const catchPairs: { hunterName: string; hiderName: string; hiderUid: string }[] = [];

    const updatedHunters = currentHunters.map(hunter => {
      if (!hunter.isAlive) return hunter;
      for (const hider of currentHiders) {
        if (hider.isCaught) continue;
        if (catchPairs.some(p => p.hiderUid === hider.uid)) continue;
        if (!this.hunterService.canCatch(hunter, hider)) continue;
        catchPairs.push({ hunterName: hunter.displayName, hiderName: hider.displayName, hiderUid: hider.uid });
        const caught = this.hunterService.performCatch(hunter, hider);
        return { ...caught, kills: caught.kills + 1 };
      }
      return hunter;
    });

    if (catchPairs.length === 0) return null;

    this.emitCatchPositions(catchPairs, updatedHunters);
    this.trackCatchCounts(catchPairs, updatedHunters);
    this.appendCatchFeed(catchPairs);

    const caughtUids = new Set(catchPairs.map(p => p.hiderUid));
    const updatedHiders = currentHiders.map(hider => {
      if (!caughtUids.has(hider.uid)) return hider;
      this.hidingService.vacate(hider.uid);
      this.pendingCatches.set(hider.uid, this.catchAnimDuration);
      return { ...hider, isCaught: true, isAlive: false, isHiding: false, hidingSpotId: null };
    });

    return { updatedHunters, updatedHiders };
  }

  /** Tick pending catches — returns UIDs ready for conversion. */
  tickPendingCatches(delta: number): Set<string> {
    const now = Date.now();
    this.catchFeed.update(f => f.filter(e => now - e.time < 3000));

    if (this.pendingCatches.size === 0) return new Set();
    const converted = new Set<string>();

    for (const [uid, remaining] of this.pendingCatches) {
      const t = remaining - delta;
      if (t <= 0) {
        converted.add(uid);
        this.pendingCatches.delete(uid);
      } else {
        this.pendingCatches.set(uid, t);
      }
    }
    return converted;
  }

  reset(): void {
    this.pendingCatches.clear();
    this.catchFeed.set([]);
    this.catchScorePositions.set([]);
  }

  private emitCatchPositions(
    catchPairs: { hunterName: string }[],
    updatedHunters: HunterState[],
  ): void {
    const positions = catchPairs
      .map(p => updatedHunters.find(h => h.displayName === p.hunterName)?.position)
      .filter((pos): pos is Vec3 => !!pos);
    this.catchScorePositions.set(positions.map(p => ({ ...p })));
  }

  private trackCatchCounts(
    catchPairs: { hunterName: string }[],
    updatedHunters: HunterState[],
  ): void {
    for (const pair of catchPairs) {
      const hunter = updatedHunters.find(h => h.displayName === pair.hunterName);
      if (hunter) this.scoring.incrementCatch(hunter.uid);
    }
  }

  private appendCatchFeed(
    catchPairs: { hunterName: string; hiderName: string }[],
  ): void {
    const now = Date.now();
    this.catchFeed.update(f => [
      ...f,
      ...catchPairs.map(p => ({ hunterName: p.hunterName, hiderName: p.hiderName, time: now })),
    ]);
  }
}
