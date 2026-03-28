// Persistent HUD progress bar showing goals until next upgrade milestone

import { MilestoneProgress } from './upgrade-state';

export class MilestoneProgressBar {
  private container: HTMLElement | null = null;
  private fill: HTMLElement | null = null;
  private label: HTMLElement | null = null;
  private lastFraction = 0;

  init(): void {
    this.container = this.buildBar();
    document.body.appendChild(this.container);
  }

  update(progress: MilestoneProgress): void {
    if (!this.fill || !this.label) return;

    const pct = Math.min(progress.fraction * 100, 100);
    this.fill.style.width = `${pct}%`;
    this.label.textContent = `${progress.current} / ${progress.target}`;

    this.container?.classList.toggle('near-complete', progress.fraction >= 0.85);
    this.container?.classList.toggle('bar-flash', progress.fraction > this.lastFraction && progress.fraction < 1);
    this.lastFraction = progress.fraction;

    // Remove flash class after animation
    if (this.container?.classList.contains('bar-flash')) {
      setTimeout(() => this.container?.classList.remove('bar-flash'), 400);
    }
  }

  destroy(): void {
    this.container?.remove();
    this.container = null;
    this.fill = null;
    this.label = null;
  }

  private buildBar(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'milestone-bar';

    const icon = document.createElement('span');
    icon.className = 'milestone-icon';
    icon.textContent = '⚡';

    const track = document.createElement('div');
    track.className = 'milestone-track';

    this.fill = document.createElement('div');
    this.fill.className = 'milestone-fill';

    this.label = document.createElement('span');
    this.label.className = 'milestone-label';
    this.label.textContent = '0 / 1';

    track.appendChild(this.fill);
    wrapper.appendChild(icon);
    wrapper.appendChild(track);
    wrapper.appendChild(this.label);
    return wrapper;
  }
}
