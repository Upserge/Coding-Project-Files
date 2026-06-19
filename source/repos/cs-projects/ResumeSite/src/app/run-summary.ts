// Run-end summary — studio modal with session stats

import { RunStats } from './run-manager';

export class RunSummary {
  private overlay: HTMLElement | null = null;

  show(stats: RunStats, onRestart: () => void): void {
    this.destroy();

    this.overlay = this.buildOverlay(stats);
    document.body.appendChild(this.overlay);

    this.overlay.querySelector('.run-summary-restart')?.addEventListener('click', () => {
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
    overlay.className = 'studio-modal-overlay run-summary-overlay';
    overlay.setAttribute('role', 'presentation');
    overlay.innerHTML = this.buildHTML(stats);
    return overlay;
  }

  private buildHTML(stats: RunStats): string {
    const minutes = Math.floor(stats.timeSeconds / 60);
    const seconds = stats.timeSeconds % 60;
    const timeFmt = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    return `
      <div class="studio-modal" role="dialog" aria-labelledby="run-summary-title" aria-modal="true">
        <header class="studio-modal-header">
          <div>
            <span class="studio-modal-kicker">Challenge</span>
            <h3 id="run-summary-title">Run ended</h3>
          </div>
        </header>
        <div class="studio-modal-body run-summary-body">
          <p class="run-summary-lead">Entropy filled the field. Here is how this run played out.</p>
          <div class="studio-stat-list">
            ${this.statRow('Final score', String(stats.score), 'gold')}
            ${this.statRow('Peak streak', `×${stats.peakCombo}`)}
            ${this.statRow('Time survived', timeFmt)}
            ${this.statRow('Upgrades collected', String(stats.upgradesCollected))}
          </div>
        </div>
        <div class="studio-modal-actions">
          <button type="button" class="studio-btn-primary run-summary-restart">Try again</button>
        </div>
      </div>
    `;
  }

  private statRow(label: string, value: string, tone?: 'gold'): string {
    const valueClass = tone === 'gold' ? ' studio-stat-value--gold' : '';
    return `
      <div class="studio-stat-row">
        <span class="studio-stat-label">${label}</span>
        <span class="studio-stat-value${valueClass}">${value}</span>
      </div>
    `;
  }
}
