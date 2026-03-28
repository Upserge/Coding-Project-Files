import { RunManager } from './run-manager';
import { UpgradeInventory } from './upgrade-inventory';
import { MilestoneProgressBar } from './milestone-progress-bar';
import { MilestoneProgress } from './upgrade-state';

function stubInventory(): UpgradeInventory {
  const inv = new UpgradeInventory();
  inv.init();
  return inv;
}

function stubProgressBar(): MilestoneProgressBar {
  const bar = new MilestoneProgressBar();
  bar.init();
  return bar;
}

const STUB_PROGRESS: MilestoneProgress = {
  current: 0,
  target: 3,
  fraction: 0,
};

describe('RunManager', () => {
  let mgr: RunManager;
  let inv: UpgradeInventory;
  let bar: MilestoneProgressBar;

  beforeEach(() => {
    mgr = new RunManager();
    mgr.init(jasmine.createSpy('onEnd'));
    inv = stubInventory();
    bar = stubProgressBar();
  });

  afterEach(() => {
    mgr.entropy.destroy();
    mgr.combo.destroy();
    inv.destroy();
    bar.destroy();
  });

  it('starts in idle phase', () => {
    expect(mgr.currentPhase).toBe('idle');
    expect(mgr.isActive).toBeFalse();
  });

  it('startRun transitions to active', () => {
    mgr.startRun(inv, bar, STUB_PROGRESS);
    expect(mgr.currentPhase).toBe('active');
    expect(mgr.isActive).toBeTrue();
  });

  it('startRun is idempotent once active', () => {
    mgr.startRun(inv, bar, STUB_PROGRESS);
    mgr.startRun(inv, bar, STUB_PROGRESS); // no-op
    expect(mgr.currentPhase).toBe('active');
  });

  it('tick returns false while alive', () => {
    mgr.startRun(inv, bar, STUB_PROGRESS);
    expect(mgr.tick(1)).toBeFalse();
  });

  it('tick is a no-op when idle', () => {
    expect(mgr.tick(1)).toBeFalse();
  });

  it('tick eventually returns true when entropy fills', () => {
    mgr.startRun(inv, bar, STUB_PROGRESS);
    let dead = false;
    for (let i = 0; i < 20000 && !dead; i++) dead = mgr.tick(1);
    expect(dead).toBeTrue();
    expect(mgr.currentPhase).toBe('ended');
  });

  it('onGoalScored returns combo multiplier', () => {
    mgr.startRun(inv, bar, STUB_PROGRESS);
    expect(mgr.onGoalScored(0)).toBe(1);
    expect(mgr.onGoalScored(0)).toBe(2);
  });

  it('onGoalScored applies entropy knockback', () => {
    mgr.startRun(inv, bar, STUB_PROGRESS);
    for (let i = 0; i < 100; i++) mgr.tick(1);
    const before = mgr.entropy.snapshot().value;
    mgr.onGoalScored(0);
    expect(mgr.entropy.snapshot().value).toBeLessThan(before);
  });

  it('onGoalScored can trigger freeze via ventFreezeChance', () => {
    mgr.startRun(inv, bar, STUB_PROGRESS);
    mgr.onGoalScored(1); // 100% chance
    expect(mgr.entropy.snapshot().frozen).toBeTrue();
  });

  it('finalizeRun fires end callback with stats', () => {
    const spy = jasmine.createSpy('onEnd');
    mgr.init(spy);
    mgr.startRun(inv, bar, STUB_PROGRESS);
    for (let i = 0; i < 60; i++) mgr.tick(1);
    mgr.onGoalScored(0);
    mgr.onGoalScored(0);
    mgr.finalizeRun(500, 3);

    expect(spy).toHaveBeenCalledTimes(1);
    const stats = spy.calls.first().args[0];
    expect(stats.score).toBe(500);
    expect(stats.peakCombo).toBe(2);
    expect(stats.timeSeconds).toBe(1);
    expect(stats.upgradesCollected).toBe(3);
  });

  it('restart resets to idle', () => {
    mgr.startRun(inv, bar, STUB_PROGRESS);
    for (let i = 0; i < 100; i++) mgr.tick(1);
    mgr.restart(inv, bar);
    expect(mgr.currentPhase).toBe('idle');
    expect(mgr.isActive).toBeFalse();
    expect(mgr.entropy.snapshot().value).toBe(0);
    expect(mgr.combo.current).toBe(0);
  });
});
