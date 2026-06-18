import { ComboStreak, STREAK_WINDOW_MS } from './combo-streak';

describe('ComboStreak', () => {
  let streak: ComboStreak;
  let now: number;

  beforeEach(() => {
    now = 0;
    document.querySelectorAll('.combo-streak').forEach((el) => el.remove());
    streak = new ComboStreak(() => now);
    streak.init();
  });

  afterEach(() => streak.destroy());

  function advance(ms: number): void {
    now += ms;
    streak.tick();
  }

  it('starts inactive with zero multiplier', () => {
    expect(streak.active).toBeFalse();
    expect(streak.current).toBe(0);
    expect(streak.peak).toBe(0);
  });

  it('feed increments multiplier and returns it', () => {
    expect(streak.feed()).toBe(1);
    expect(streak.feed()).toBe(2);
    expect(streak.current).toBe(2);
  });

  it('feed caps at MAX_MULTIPLIER (10)', () => {
    for (let i = 0; i < 15; i++) streak.feed();
    expect(streak.current).toBe(10);
    expect(streak.feed()).toBe(10);
  });

  it('becomes active after feed', () => {
    streak.feed();
    expect(streak.active).toBeTrue();
  });

  it('timer drains over 4 seconds of game time', () => {
    streak.feed();
    advance(STREAK_WINDOW_MS - 1);
    expect(streak.active).toBeTrue();

    advance(1);
    expect(streak.active).toBeFalse();
    expect(streak.current).toBe(0);
  });

  it('feed resets the timer', () => {
    streak.feed();
    advance(3000);
    streak.feed();
    advance(3000);
    expect(streak.active).toBeTrue();
  });

  it('tracks peak multiplier', () => {
    streak.feed();
    streak.feed();
    streak.feed();
    advance(STREAK_WINDOW_MS);
    expect(streak.peak).toBe(3);
    expect(streak.current).toBe(0);
  });

  it('snapshot returns correct state', () => {
    streak.feed();
    const snap = streak.snapshot();
    expect(snap.multiplier).toBe(1);
    expect(snap.active).toBeTrue();
    expect(snap.timerFraction).toBe(1);
  });

  it('snapshot timerFraction drains', () => {
    streak.feed();
    advance(STREAK_WINDOW_MS / 2);
    expect(streak.snapshot().timerFraction).toBeCloseTo(0.5, 2);
  });

  it('tick does nothing when inactive', () => {
    streak.tick();
    streak.tick();
    expect(streak.current).toBe(0);
    expect(streak.active).toBeFalse();
  });

  it('reset clears all state', () => {
    streak.feed();
    streak.feed();
    streak.feed();
    streak.reset();

    expect(streak.current).toBe(0);
    expect(streak.peak).toBe(0);
    expect(streak.active).toBeFalse();
  });

  it('chip appears after first goal in chain', () => {
    streak.feed();
    const el = streak.uiRoot;
    expect(el?.classList.contains('combo-streak--active')).toBeTrue();
    expect(el?.querySelector('.combo-streak-mult')?.textContent).toBe('×1');
    expect(el?.querySelector('.combo-streak-ring')?.getAttribute('style')).toContain('--streak-progress');
  });

  it('chip activates at ×2', () => {
    streak.feed();
    streak.feed();
    const el = streak.uiRoot;
    expect(el?.classList.contains('combo-streak--active')).toBeTrue();
    expect(el?.querySelector('.combo-streak-mult')?.textContent).toBe('×2');
  });

  it('chip deactivates when streak expires', () => {
    streak.feed();
    streak.feed();
    advance(STREAK_WINDOW_MS);
    const el = streak.uiRoot;
    expect(el?.classList.contains('combo-streak--active')).toBeFalse();
  });

  it('ring progress drains with timer', () => {
    streak.feed();
    streak.feed();
    advance(STREAK_WINDOW_MS / 2);
    const ring = streak.uiRoot?.querySelector('.combo-streak-ring') as HTMLElement | null;
    expect(Number(ring?.style.getPropertyValue('--streak-progress'))).toBeCloseTo(0.5, 2);
  });

  it('chip enters hot state at ×5', () => {
    for (let i = 0; i < 5; i++) streak.feed();
    const el = streak.uiRoot;
    expect(el?.classList.contains('combo-streak--hot')).toBeTrue();
    expect(el?.querySelector('.combo-streak-mult')?.textContent).toBe('×5');
  });

  it('extends deadline after long gaps (pause / tab hide)', () => {
    streak.feed();
    advance(500);
    advance(10_000);
    expect(streak.active).toBeTrue();
    expect(streak.snapshot().timerFraction).toBeCloseTo(0.875, 2);
  });
});
