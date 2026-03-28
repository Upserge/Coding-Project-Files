// Entropy meter: corruption bar that fills over time and ends the run at 100%
// Scoring goals knocks it back; upgrades slow the rate.

export interface EntropySnapshot {
  readonly value: number;
  readonly rate: number;
  readonly frozen: boolean;
}

const BASE_RATE = 0.00025;
const ACCELERATION_PER_SECOND = 0.0000012;
const BASE_KNOCKBACK = 0.15;
const FREEZE_FRAMES = 180; // 3 seconds at 60fps
const DANGER_THRESHOLD = 0.7;

export class EntropyMeter {
  private value = 0;
  private elapsed = 0;
  private freezeTimer = 0;
  private rateMul = 1;

  private container: HTMLElement | null = null;
  private fill: HTMLElement | null = null;
  private label: HTMLElement | null = null;

  init(): void {
    this.container = this.buildBar();
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

  /** Call once per frame. Returns true when entropy hits 100%. */
  tick(): boolean {
    if (this.freezeTimer > 0) {
      this.freezeTimer--;
      this.updateDOM();
      return false;
    }

    this.elapsed++;
    const accel = 1 + (this.elapsed / 60) * ACCELERATION_PER_SECOND * 60;
    this.value += BASE_RATE * accel * this.rateMul;
    this.value = Math.min(this.value, 1);

    this.updateDOM();
    return this.value >= 1;
  }

  /** Push entropy back when a goal is scored. */
  knockback(comboMultiplier: number): void {
    console.log('[EntropyMeter.knockback] value before:', this.value, 'comboMultiplier:', comboMultiplier);
    this.value -= BASE_KNOCKBACK * comboMultiplier;
    this.value = Math.max(this.value, 0);
    console.log('[EntropyMeter.knockback] value after:', this.value);
  }

  /** Freeze entropy for a short burst (emergency-vent upgrade). */
  freeze(): void {
    this.freezeTimer = FREEZE_FRAMES;
  }

  setRateMultiplier(mul: number): void {
    this.rateMul = mul;
  }

  snapshot(): EntropySnapshot {
    return { value: this.value, rate: this.rateMul, frozen: this.freezeTimer > 0 };
  }

  reset(): void {
    this.value = 0;
    this.elapsed = 0;
    this.freezeTimer = 0;
    this.rateMul = 1;
    this.updateDOM();
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
    this.fill = null;
    this.label = null;
  }

  private buildBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'entropy-bar';

    const icon = document.createElement('span');
    icon.className = 'entropy-icon';
    icon.textContent = '☠️';

    const track = document.createElement('div');
    track.className = 'entropy-track';

    this.fill = document.createElement('div');
    this.fill.className = 'entropy-fill';

    this.label = document.createElement('span');
    this.label.className = 'entropy-label';
    this.label.textContent = '0%';

    track.appendChild(this.fill);
    bar.appendChild(icon);
    bar.appendChild(track);
    bar.appendChild(this.label);
    return bar;
  }

  private updateDOM(): void {
    if (!this.fill || !this.label || !this.container) return;

    const pct = Math.min(this.value * 100, 100);
    this.fill.style.width = `${pct}%`;
    this.label.textContent = `${Math.floor(pct)}%`;

    this.container.classList.toggle('entropy-danger', this.value >= DANGER_THRESHOLD);
    this.container.classList.toggle('entropy-frozen', this.freezeTimer > 0);
  }
}
