import { ComboTracker } from './combo-tracker';

describe('ComboTracker', () => {
  let tracker: ComboTracker;

  beforeEach(() => {
    tracker = new ComboTracker();
    tracker.init();
  });

  afterEach(() => tracker.destroy());

  it('starts inactive with zero multiplier', () => {
    expect(tracker.active).toBeFalse();
    expect(tracker.current).toBe(0);
    expect(tracker.peak).toBe(0);
  });

  it('feed increments multiplier and returns it', () => {
    expect(tracker.feed()).toBe(1);
    expect(tracker.feed()).toBe(2);
    expect(tracker.current).toBe(2);
  });

  it('feed caps at MAX_MULTIPLIER (10)', () => {
    for (let i = 0; i < 15; i++) tracker.feed();
    expect(tracker.current).toBe(10);
    expect(tracker.feed()).toBe(10);
  });

  it('becomes active after feed', () => {
    tracker.feed();
    expect(tracker.active).toBeTrue();
  });

  it('timer drains over 240 frames and resets multiplier', () => {
    tracker.feed();
    for (let i = 0; i < 239; i++) tracker.tick();
    expect(tracker.active).toBeTrue();

    tracker.tick(); // frame 240 — timer reaches 0
    expect(tracker.active).toBeFalse();
    expect(tracker.current).toBe(0);
  });

  it('feed resets the timer', () => {
    tracker.feed();
    for (let i = 0; i < 200; i++) tracker.tick();
    tracker.feed(); // refresh
    for (let i = 0; i < 200; i++) tracker.tick();
    expect(tracker.active).toBeTrue(); // still within 240 of second feed
  });

  it('tracks peak multiplier', () => {
    tracker.feed();
    tracker.feed();
    tracker.feed();
    // let combo expire
    for (let i = 0; i < 240; i++) tracker.tick();
    expect(tracker.peak).toBe(3);
    expect(tracker.current).toBe(0);
  });

  it('snapshot returns correct state', () => {
    tracker.feed();
    const snap = tracker.snapshot();
    expect(snap.multiplier).toBe(1);
    expect(snap.active).toBeTrue();
    expect(snap.timerFraction).toBe(1);
  });

  it('snapshot timerFraction drains', () => {
    tracker.feed();
    for (let i = 0; i < 120; i++) tracker.tick();
    expect(tracker.snapshot().timerFraction).toBe(0.5);
  });

  it('tick does nothing when inactive', () => {
    tracker.tick();
    tracker.tick();
    expect(tracker.current).toBe(0);
    expect(tracker.active).toBeFalse();
  });

  it('reset clears all state', () => {
    tracker.feed();
    tracker.feed();
    tracker.feed();
    tracker.reset();

    expect(tracker.current).toBe(0);
    expect(tracker.peak).toBe(0);
    expect(tracker.active).toBeFalse();
  });
});
