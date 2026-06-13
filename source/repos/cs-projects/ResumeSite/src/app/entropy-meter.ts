// Entropy meter: corruption bar that fills over time and ends the run at 100%
// Scoring goals knocks it back; upgrades slow the rate.

export interface EntropySnapshot {
  readonly value: number;
  readonly rate: number;
  readonly frozen: boolean;
}

const BASE_RATE = 0.00025;
const STORY_RATE_MUL = 0.35;
const STORY_MAX_VALUE = 0.72;
const ACCELERATION_PER_SECOND = 0.0000012;
const STORY_ACCEL_MUL = 0.25;
const BASE_KNOCKBACK = 0.15;
const STORY_KNOCKBACK_MUL = 1.55;
const FREEZE_FRAMES = 180; // 3 seconds at 60fps
const DANGER_THRESHOLD = 0.7;

export class EntropyMeter {
  private value = 0;
  private elapsed = 0;
  private freezeTimer = 0;
  private rateMul = 1;
  private storyPhase = false;
  private knockbackMul = 1;

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

  /** Story phase: entropy cannot end the run; fills slowly with a lower cap. */
  setStoryPhase(active: boolean): void {
    this.storyPhase = active;
    if (active && this.value > STORY_MAX_VALUE) {
      this.value = STORY_MAX_VALUE;
    }
    this.updateDOM();
  }

  setKnockbackMultiplier(mul: number): void {
    this.knockbackMul = mul;
  }

  /** Call once per frame. Returns true when entropy hits 100% (challenge mode only). */
  tick(): boolean {
    if (this.freezeTimer > 0) {
      this.freezeTimer--;
      this.updateDOM();
      return false;
    }

    this.elapsed++;
    const accelBase = this.storyPhase ? ACCELERATION_PER_SECOND * STORY_ACCEL_MUL : ACCELERATION_PER_SECOND;
    const rateBase = this.storyPhase ? BASE_RATE * STORY_RATE_MUL : BASE_RATE;
    const accel = 1 + (this.elapsed / 60) * accelBase * 60;
    this.value += rateBase * accel * this.rateMul;
    if (this.storyPhase) {
      this.value = Math.min(this.value, STORY_MAX_VALUE);
      this.updateDOM();
      return false;
    }

    this.value = Math.min(this.value, 1);

    this.updateDOM();
    return this.value >= 1;
  }

  /** Push entropy back when a goal is scored. */
  knockback(comboMultiplier: number): void {
    this.value -= BASE_KNOCKBACK * this.knockbackMul * comboMultiplier;
    this.value = Math.max(this.value, 0);
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
    this.storyPhase = false;
    this.knockbackMul = 1;
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

    if (this.storyPhase) {
      this.label.textContent = 'Story';
      this.container.classList.remove('entropy-danger');
      this.container.classList.toggle('entropy-frozen', this.freezeTimer > 0);
      this.container.classList.add('entropy-story');
      return;
    }

    this.container.classList.remove('entropy-story');
    this.label.textContent = `${Math.floor(pct)}%`;

    this.container.classList.toggle('entropy-danger', this.value >= DANGER_THRESHOLD);
    this.container.classList.toggle('entropy-frozen', this.freezeTimer > 0);
  }
}
