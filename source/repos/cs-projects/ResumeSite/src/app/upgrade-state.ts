// Tracks session score, active upgrades, milestones, and computed modifiers

import { Upgrade, UPGRADE_POOL } from './upgrade-registry';

const MILESTONES = [1, 5, 15, 30, 50] as const;
const MILESTONE_REPEAT_INTERVAL = 20;

export interface GameModifiers {
  readonly repulseRadiusMul: number;
  readonly repulseForceMul: number;
  readonly dragRetention: number;
  readonly goalRadiusMul: number;
  readonly gravityWellStrength: number;
  readonly tractorAimStrength: number;
  readonly doubleCollapseChance: number;
  readonly extraRockets: number;
  readonly extraGoals: number;
  readonly chainReactionActive: boolean;
  readonly entropyRateMul: number;
  readonly ventFreezeChance: number;
  readonly phoenixProtocol: boolean;
  readonly singularityPulseInterval: number;
}

export interface MilestoneProgress {
  readonly current: number;
  readonly target: number;
  readonly fraction: number;
}

export class UpgradeState {
  private sessionScore = 0;
  private readonly stacks = new Map<string, number>();
  private lastMilestoneIndex = -1;
  private chainReactionTimer = 0;

  get score(): number {
    return this.sessionScore;
  }

  get stackMap(): ReadonlyMap<string, number> {
    return this.stacks;
  }

  getStacks(upgradeId: string): number {
    return this.stacks.get(upgradeId) ?? 0;
  }

  addScore(points: number): void {
    this.sessionScore += points;
  }

  applyUpgrade(upgrade: Upgrade): void {
    const current = this.stacks.get(upgrade.id) ?? 0;
    if (current >= upgrade.maxStacks) return;
    this.stacks.set(upgrade.id, current + 1);
  }

  checkMilestone(totalScore: number): boolean {
    const nextIndex = this.lastMilestoneIndex + 1;

    if (nextIndex < MILESTONES.length) {
      if (totalScore < MILESTONES[nextIndex]) return false;
      this.lastMilestoneIndex = nextIndex;
      return true;
    }

    const lastFixed = MILESTONES[MILESTONES.length - 1];
    const overshoot = totalScore - lastFixed;
    const repeatsNeeded = Math.floor(overshoot / MILESTONE_REPEAT_INTERVAL);
    const repeatsTriggered = this.lastMilestoneIndex - (MILESTONES.length - 1);
    if (repeatsNeeded <= repeatsTriggered) return false;

    this.lastMilestoneIndex++;
    return true;
  }

  computeScorePoints(): number {
    const chance = this.getStacks('double-collapse') * 0.20;
    if (Math.random() < chance) return 2;
    return 1;
  }

  triggerChainReaction(): void {
    if (this.getStacks('chain-reaction') < 1) return;
    this.chainReactionTimer = 90;
  }

  tickChainReaction(): void {
    if (this.chainReactionTimer <= 0) return;
    this.chainReactionTimer--;
  }

  get modifiers(): GameModifiers {
    return {
      repulseRadiusMul: 1 + this.getStacks('bigger-push') * 0.20,
      repulseForceMul: 1 + this.getStacks('stronger-thrusters') * 0.25,
      dragRetention: 0.98 + this.getStacks('momentum-lock') * 0.008,
      goalRadiusMul: this.computeGoalRadiusMul(),
      gravityWellStrength: this.getStacks('gravity-well') * 0.012,
      tractorAimStrength: this.getStacks('tractor-aim') * 0.006,
      doubleCollapseChance: this.getStacks('double-collapse') * 0.20,
      extraRockets: this.getStacks('multi-rocket'),
      extraGoals: this.getStacks('dark-matter-rush') * 2,
      chainReactionActive: this.chainReactionTimer > 0,
      entropyRateMul: Math.max(0.1, 1 - this.getStacks('entropy-shield') * 0.15),
      ventFreezeChance: this.getStacks('emergency-vent') * 0.25,
      phoenixProtocol: this.getStacks('phoenix-protocol') >= 1,
      singularityPulseInterval: this.getStacks('singularity-pulse') >= 1 ? 5 : 0,
    };
  }

  reset(): void {
    this.sessionScore = 0;
    this.stacks.clear();
    this.lastMilestoneIndex = -1;
    this.chainReactionTimer = 0;
  }

  nextMilestoneProgress(): MilestoneProgress {
    const nextIndex = this.lastMilestoneIndex + 1;

    if (nextIndex < MILESTONES.length) {
      const prev = nextIndex === 0 ? 0 : MILESTONES[nextIndex - 1];
      const target = MILESTONES[nextIndex];
      const progress = this.sessionScore - prev;
      const range = target - prev;
      return { current: progress, target: range, fraction: Math.min(progress / range, 1) };
    }

    const lastFixed = MILESTONES[MILESTONES.length - 1];
    const overshoot = this.sessionScore - lastFixed;
    const repeatsTriggered = this.lastMilestoneIndex - (MILESTONES.length - 1);
    const prevThreshold = lastFixed + repeatsTriggered * MILESTONE_REPEAT_INTERVAL;
    const nextThreshold = prevThreshold + MILESTONE_REPEAT_INTERVAL;
    const progress = this.sessionScore - prevThreshold;
    return { current: progress, target: MILESTONE_REPEAT_INTERVAL, fraction: Math.min(progress / MILESTONE_REPEAT_INTERVAL, 1) };
  }

  private computeGoalRadiusMul(): number {
    const base = 1 + this.getStacks('wider-horizon') * 0.15;
    if (this.chainReactionTimer <= 0) return base;
    return base * 1.30;
  }
}
