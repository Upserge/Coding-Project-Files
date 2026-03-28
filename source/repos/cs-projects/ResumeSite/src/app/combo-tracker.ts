// Combo tracker: consecutive goals within a time window build a multiplier

export interface ComboSnapshot {
  readonly multiplier: number;
  readonly timerFraction: number;
  readonly active: boolean;
}

const COMBO_WINDOW_FRAMES = 240; // 4 seconds at 60fps
const MAX_MULTIPLIER = 10;

export class ComboTracker {
  private multiplier = 0;
  private timer = 0;
  private peakMultiplier = 0;

  private container: HTMLElement | null = null;
  private mulLabel: HTMLElement | null = null;
  private ring: HTMLElement | null = null;

  init(): void {
    this.container = this.buildUI();
    document.body.appendChild(this.container);
    this.hide();
  }

  show(): void {
    if (!this.container) return;
    this.container.style.display = 'flex';
  }

  hide(): void {
    if (!this.container) return;
    this.container.style.display = 'none';
  }

  /** Call when a goal is scored. Returns the effective multiplier for this goal. */
  feed(): number {
    this.multiplier = Math.min(this.multiplier + 1, MAX_MULTIPLIER);
    this.timer = COMBO_WINDOW_FRAMES;
    this.peakMultiplier = Math.max(this.peakMultiplier, this.multiplier);
    this.updateDOM();
    return this.multiplier;
  }

  /** Call once per frame to drain the combo timer. */
  tick(): void {
    if (this.timer <= 0) return;

    this.timer--;
    if (this.timer <= 0) {
      this.multiplier = 0;
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

  snapshot(): ComboSnapshot {
    return {
      multiplier: this.multiplier,
      timerFraction: this.timer / COMBO_WINDOW_FRAMES,
      active: this.multiplier > 0,
    };
  }

  reset(): void {
    this.multiplier = 0;
    this.timer = 0;
    this.peakMultiplier = 0;
    this.updateDOM();
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
    this.mulLabel = null;
    this.ring = null;
  }

  private buildUI(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'combo-tracker';

    this.ring = document.createElement('div');
    this.ring.className = 'combo-ring';

    this.mulLabel = document.createElement('span');
    this.mulLabel.className = 'combo-label';
    this.mulLabel.textContent = '';

    this.ring.appendChild(this.mulLabel);
    wrap.appendChild(this.ring);
    return wrap;
  }

  private updateDOM(): void {
    if (!this.mulLabel || !this.ring || !this.container) return;

    if (this.multiplier < 2) {
      this.container.classList.remove('combo-active');
      this.mulLabel.textContent = '';
      this.ring.style.setProperty('--combo-progress', '0');
      return;
    }

    this.container.classList.add('combo-active');
    this.mulLabel.textContent = `×${this.multiplier}`;
    this.ring.style.setProperty('--combo-progress', String(this.timer / COMBO_WINDOW_FRAMES));

    this.container.classList.toggle('combo-hot', this.multiplier >= 5);
  }
}
