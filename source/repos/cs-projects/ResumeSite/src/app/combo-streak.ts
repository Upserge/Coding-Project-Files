// Streak chip: consecutive goals within a time window build a score multiplier.

export interface StreakSnapshot {
  readonly multiplier: number;
  readonly timerFraction: number;
  readonly active: boolean;
}

/** Wall-clock streak window — matches UI copy/tooltip. */
export const STREAK_WINDOW_MS = 4000;
/** Gaps longer than this between ticks extend the deadline (pause / tab hide). */
const PAUSE_GAP_MS = 250;
const MAX_MULTIPLIER = 10;

type Clock = () => number;

export class ComboStreak {
  private multiplier = 0;
  private deadlineMs = 0;
  private lastTickMs = 0;
  private peakMultiplier = 0;

  private container: HTMLElement | null = null;
  private ringEl: HTMLElement | null = null;
  private multEl: HTMLElement | null = null;
  private trackEl: HTMLElement | null = null;

  constructor(private readonly clock: Clock = () => performance.now()) {}

  init(): void {
    this.container = this.buildUI();
    document.body.appendChild(this.container);
    this.updateDOM();
  }

  /** Call when a goal is scored. Returns the effective multiplier for this goal. */
  feed(): number {
    this.multiplier = Math.min(this.multiplier + 1, MAX_MULTIPLIER);
    const now = this.clock();
    this.deadlineMs = now + STREAK_WINDOW_MS;
    this.lastTickMs = now;
    this.peakMultiplier = Math.max(this.peakMultiplier, this.multiplier);
    this.updateDOM();
    return this.multiplier;
  }

  /** Call once per frame while the game loop is running. */
  tick(): void {
    const now = this.clock();

    if (this.deadlineMs > 0 && this.lastTickMs > 0) {
      const gap = now - this.lastTickMs;
      if (gap > PAUSE_GAP_MS) {
        this.deadlineMs += gap;
      }
    }
    this.lastTickMs = now;

    if (this.deadlineMs > 0 && now >= this.deadlineMs) {
      this.multiplier = 0;
      this.deadlineMs = 0;
    }

    this.updateDOM();
  }

  get active(): boolean {
    return this.multiplier > 0;
  }

  get current(): number {
    return this.multiplier;
  }

  get peak(): number {
    return this.peakMultiplier;
  }

  get remainingMs(): number {
    if (this.deadlineMs <= 0) return 0;
    return Math.max(0, this.deadlineMs - this.clock());
  }

  snapshot(): StreakSnapshot {
    const remaining = this.remainingMs;
    return {
      multiplier: this.multiplier,
      timerFraction: remaining / STREAK_WINDOW_MS,
      active: this.multiplier > 0 && remaining > 0,
    };
  }

  reset(): void {
    this.multiplier = 0;
    this.deadlineMs = 0;
    this.lastTickMs = 0;
    this.peakMultiplier = 0;
    this.updateDOM();
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
    this.ringEl = null;
    this.multEl = null;
    this.trackEl = null;
  }

  /** Root element for unit tests */
  get uiRoot(): HTMLElement | null {
    return this.container;
  }

  private buildUI(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'combo-streak';
    wrap.setAttribute('aria-live', 'polite');
    wrap.title = 'Chain goals within 4 seconds. The ring drains — score again before it closes.';

    this.ringEl = document.createElement('div');
    this.ringEl.className = 'combo-streak-ring';

    const pill = document.createElement('div');
    pill.className = 'combo-streak-pill';

    const kicker = document.createElement('span');
    kicker.className = 'combo-streak-kicker';
    kicker.textContent = 'Streak';

    this.multEl = document.createElement('span');
    this.multEl.className = 'combo-streak-mult';

    pill.append(kicker, this.multEl);
    this.ringEl.appendChild(pill);

    this.trackEl = document.createElement('div');
    this.trackEl.className = 'combo-streak-track';
    this.trackEl.setAttribute('role', 'progressbar');
    this.trackEl.setAttribute('aria-valuemin', '0');
    this.trackEl.setAttribute('aria-valuemax', '100');
    this.trackEl.setAttribute('aria-valuenow', '0');
    this.trackEl.setAttribute('aria-label', 'Streak timer');

    wrap.append(this.ringEl, this.trackEl);
    return wrap;
  }

  private updateDOM(): void {
    if (!this.container || !this.ringEl || !this.multEl || !this.trackEl) return;

    const remainingMs = this.remainingMs;
    const visible = this.multiplier > 0 && remainingMs > 0;
    const fraction = Math.max(0, Math.min(1, remainingMs / STREAK_WINDOW_MS));

    this.container.classList.toggle('combo-streak--active', visible);
    this.container.classList.toggle('combo-streak--hot', visible && this.multiplier >= 5);
    this.ringEl.style.setProperty('--streak-progress', String(fraction));

    if (!visible) {
      this.multEl.textContent = '';
      this.trackEl.setAttribute('aria-valuenow', '0');
      return;
    }

    this.multEl.textContent = `×${this.multiplier}`;
    this.trackEl.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
  }
}
