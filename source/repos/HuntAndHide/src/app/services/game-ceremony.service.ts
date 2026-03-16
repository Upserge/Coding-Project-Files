import { Injectable, signal } from '@angular/core';
import { CeremonyStep, buildBeginningGameCeremony } from '../models/game-ceremony.model';
import { PlayerRole } from '../models/player.model';

@Injectable({ providedIn: 'root' })
export class GameCeremonyService {
  readonly activeStep = signal<CeremonyStep | null>(null);

  private queue: CeremonyStep[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;

  playBeginningGame(role: PlayerRole): void {
    this.play(buildBeginningGameCeremony(role));
  }

  play(steps: CeremonyStep[]): void {
    this.clear();
    this.queue = [...steps];
    this.showNext();
  }

  clear(): void {
    this.activeStep.set(null);
    this.queue = [];
    this.clearTimer();
  }

  private showNext(): void {
    const next = this.queue.shift() ?? null;
    this.activeStep.set(next);
    if (!next) return;
    this.timer = setTimeout(() => this.showNext(), next.durationMs);
  }

  private clearTimer(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
