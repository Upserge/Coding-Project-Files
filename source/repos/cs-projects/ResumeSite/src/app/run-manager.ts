// Run lifecycle manager: idle → active → ended
// Orchestrates entropy, combo, HUD visibility, and run-end summary

import { EntropyMeter } from './entropy-meter';
import { ComboTracker } from './combo-tracker';
import { UpgradeInventory } from './upgrade-inventory';
import { MilestoneProgressBar } from './milestone-progress-bar';
import { MilestoneProgress } from './upgrade-state';

export type RunPhase = 'idle' | 'active' | 'ended';

export interface RunStats {
  readonly score: number;
  readonly peakCombo: number;
  readonly timeSeconds: number;
  readonly upgradesCollected: number;
}

export class RunManager {
  private phase: RunPhase = 'idle';
  private startFrame = 0;
  private frameCount = 0;

  readonly entropy = new EntropyMeter();
  readonly combo = new ComboTracker();

  private onEndCallback: ((stats: RunStats) => void) | null = null;

  init(onEnd: (stats: RunStats) => void): void {
    this.entropy.init();
    this.combo.init();
    this.onEndCallback = onEnd;
  }

  get currentPhase(): RunPhase {
    return this.phase;
  }

  get isActive(): boolean {
    return this.phase === 'active';
  }

  /** Called on first goal to transition from idle → active and reveal HUD */
  startRun(inventory: UpgradeInventory, progressBar: MilestoneProgressBar, progress: MilestoneProgress): void {
    if (this.phase !== 'idle') return;

    this.phase = 'active';
    this.startFrame = 0;
    this.frameCount = 0;

    this.entropy.show();
    this.combo.show();
    inventory.show();
    progressBar.show();
    progressBar.update(progress);
  }

  /** Called every frame during active run. Returns true if run just ended. */
  tick(entropyRateMul: number): boolean {
    if (this.phase !== 'active') return false;

    this.frameCount++;
    this.entropy.setRateMultiplier(entropyRateMul);
    this.combo.tick();

    const dead = this.entropy.tick();
    if (!dead) return false;

    this.phase = 'ended';
    return true;
  }

  /** Process a goal score: combo feed + entropy knockback. Returns combo multiplier. */
  onGoalScored(ventFreezeChance: number): number {
    const multiplier = this.combo.feed();
    this.entropy.knockback(multiplier);

    if (ventFreezeChance > 0 && Math.random() < ventFreezeChance) {
      this.entropy.freeze();
    }

    return multiplier;
  }

  /** Build final stats and fire end callback */
  finalizeRun(score: number, upgradesCollected: number): void {
    const stats: RunStats = {
      score,
      peakCombo: this.combo.peak,
      timeSeconds: Math.floor(this.frameCount / 60),
      upgradesCollected,
    };
    this.onEndCallback?.(stats);
  }

  /** Full reset for "Try Again" */
  restart(inventory: UpgradeInventory, progressBar: MilestoneProgressBar): void {
    this.phase = 'idle';
    this.frameCount = 0;
    this.entropy.reset();
    this.entropy.hide();
    this.combo.reset();
    this.combo.hide();
    inventory.hide();
    progressBar.hide();
  }

  destroy(): void {
    this.entropy.destroy();
    this.combo.destroy();
    this.onEndCallback = null;
  }
}
