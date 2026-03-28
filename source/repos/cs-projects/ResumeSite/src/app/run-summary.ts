// Run-end summary panel: shows final stats and restart button

import { RunStats } from './run-manager';

export class RunSummary {
  private overlay: HTMLElement | null = null;

  show(stats: RunStats, onRestart: () => void): void {
    this.destroy();

    this.overlay = this.buildOverlay(stats);
    document.body.appendChild(this.overlay);

    this.overlay.querySelector('.run-restart')
      ?.addEventListener('click', () => {
        this.destroy();
        onRestart();
      });

    requestAnimationFrame(() => this.overlay?.classList.add('visible'));
  }

  destroy(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  private buildOverlay(stats: RunStats): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'run-summary-overlay';
    overlay.innerHTML = this.buildHTML(stats);
    return overlay;
  }

  private buildHTML(stats: RunStats): string {
    const minutes = Math.floor(stats.timeSeconds / 60);
    const seconds = stats.timeSeconds % 60;
    const timeFmt = minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;

    return `
      <div class="run-summary-content">
        <h2 class="run-summary-title">💀 Run Over</h2>
        <p class="run-summary-subtitle">Entropy consumed the field</p>
        <div class="run-stats">
          ${this.statRow('🏆', 'Final Score', String(stats.score))}
          ${this.statRow('🔥', 'Peak Combo', `×${stats.peakCombo}`)}
          ${this.statRow('⏱️', 'Time Survived', timeFmt)}
          ${this.statRow('⚡', 'Upgrades', String(stats.upgradesCollected))}
        </div>
        <button class="run-restart">🔄 Try Again</button>
      </div>
    `;
  }

  private statRow(icon: string, label: string, value: string): string {
    return `
      <div class="run-stat-row">
        <span class="run-stat-icon">${icon}</span>
        <span class="run-stat-label">${label}</span>
        <span class="run-stat-value">${value}</span>
      </div>`;
  }
}
