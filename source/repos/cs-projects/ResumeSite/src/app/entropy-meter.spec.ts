import { EntropyMeter } from './entropy-meter';

describe('EntropyMeter', () => {
  let meter: EntropyMeter;

  beforeEach(() => {
    meter = new EntropyMeter();
    meter.init();
  });

  afterEach(() => meter.destroy());

  it('starts at zero', () => {
    const snap = meter.snapshot();
    expect(snap.value).toBe(0);
    expect(snap.frozen).toBe(false);
    expect(snap.rate).toBe(1);
  });

  it('tick increases value', () => {
    meter.tick();
    expect(meter.snapshot().value).toBeGreaterThan(0);
  });

  it('tick does not exceed 1', () => {
    for (let i = 0; i < 20000; i++) meter.tick();
    expect(meter.snapshot().value).toBe(1);
  });

  it('tick returns true at 100%', () => {
    let dead = false;
    for (let i = 0; i < 20000 && !dead; i++) dead = meter.tick();
    expect(dead).toBeTrue();
  });

  it('knockback reduces value', () => {
    for (let i = 0; i < 100; i++) meter.tick();
    const before = meter.snapshot().value;
    meter.knockback(1);
    expect(meter.snapshot().value).toBeLessThan(before);
  });

  it('knockback does not go below zero', () => {
    meter.tick();
    meter.knockback(999);
    expect(meter.snapshot().value).toBe(0);
  });

  it('freeze pauses ticking for 180 frames', () => {
    for (let i = 0; i < 50; i++) meter.tick();
    meter.freeze();
    expect(meter.snapshot().frozen).toBeTrue();

    const frozenVal = meter.snapshot().value;
    for (let i = 0; i < 179; i++) meter.tick();
    expect(meter.snapshot().value).toBe(frozenVal);
    expect(meter.snapshot().frozen).toBeTrue();

    meter.tick(); // frame 180 — unfreeze
    expect(meter.snapshot().frozen).toBeFalse();
  });

  it('resumes ticking after freeze expires', () => {
    for (let i = 0; i < 50; i++) meter.tick();
    meter.freeze();
    const frozenVal = meter.snapshot().value;
    for (let i = 0; i < 180; i++) meter.tick();
    meter.tick(); // first real tick after unfreeze
    expect(meter.snapshot().value).toBeGreaterThan(frozenVal);
  });

  it('setRateMultiplier affects tick rate', () => {
    meter.setRateMultiplier(2);
    meter.tick();
    const fast = meter.snapshot().value;

    meter.reset();
    meter.setRateMultiplier(1);
    meter.tick();
    const normal = meter.snapshot().value;

    expect(fast).toBeGreaterThan(normal);
  });

  it('acceleration increases rate over time', () => {
    meter.tick();
    const firstDelta = meter.snapshot().value;

    meter.reset();
    for (let i = 0; i < 600; i++) meter.tick(); // 10s elapsed
    const before600 = meter.snapshot().value;
    meter.tick();
    const delta600 = meter.snapshot().value - before600;

    expect(delta600).toBeGreaterThan(firstDelta);
  });

  it('reset clears all state', () => {
    for (let i = 0; i < 200; i++) meter.tick();
    meter.freeze();
    meter.setRateMultiplier(0.5);
    meter.reset();

    const snap = meter.snapshot();
    expect(snap.value).toBe(0);
    expect(snap.frozen).toBe(false);
    expect(snap.rate).toBe(1);
  });
});
