// Fullscreen upgrade picker modal — shows 3 random upgrade cards with rarity styling

import { Upgrade, getCategoryIcon, pickRandomUpgrades, RARITY_COLORS, RARITY_LABELS } from './upgrade-registry';
import { UpgradeVFX } from './upgrade-vfx';

type ChoiceCallback = (upgrade: Upgrade) => void;

export class UpgradeModal {
  private overlay: HTMLElement | null = null;
  private onChoice: ChoiceCallback | null = null;
  private readonly vfx = new UpgradeVFX();

  show(stacks: ReadonlyMap<string, number>, onChoice: ChoiceCallback): void {
    this.destroy();

    const choices = pickRandomUpgrades(stacks, 3);
    if (choices.length === 0) return;

    this.onChoice = onChoice;
    this.overlay = this.buildOverlay(choices);
    document.body.appendChild(this.overlay);

    this.vfx.burstOpen();
    requestAnimationFrame(() => this.overlay?.classList.add('visible'));
  }

  destroy(): void {
    if (!this.overlay) return;
    this.overlay.remove();
    this.overlay = null;
    this.onChoice = null;
  }

  destroyAll(): void {
    this.destroy();
    this.vfx.destroy();
  }

  get isOpen(): boolean {
    return this.overlay !== null;
  }

  private buildOverlay(choices: Upgrade[]): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'upgrade-overlay';
    overlay.innerHTML = this.buildHTML(choices);
    this.bindButtons(overlay, choices);
    return overlay;
  }

  private buildHTML(choices: Upgrade[]): string {
    const cards = choices.map((u, i) => {
      const color = RARITY_COLORS[u.rarity];
      const label = RARITY_LABELS[u.rarity];
      return `
      <button class="upgrade-card rarity-${u.rarity}" data-index="${i}"
              style="--card-delay: ${i * 0.08}s; --rarity-color: ${color}">
        <span class="upgrade-rarity-badge" style="color: ${color}; border-color: ${color}">${label}</span>
        <span class="upgrade-icon">${getCategoryIcon(u.category)}</span>
        <span class="upgrade-name">${u.name}</span>
        <span class="upgrade-desc">${u.description}</span>
        <span class="upgrade-category">${u.category}</span>
      </button>
    `;
    }).join('');

    return `
      <div class="upgrade-content">
        <h2 class="upgrade-title">⚡ System Upgrade Available</h2>
        <p class="upgrade-subtitle">Choose one enhancement for your fleet</p>
        <div class="upgrade-cards">${cards}</div>
      </div>
    `;
  }

  private bindButtons(overlay: HTMLElement, choices: Upgrade[]): void {
    overlay.querySelectorAll('.upgrade-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = Number((btn as HTMLElement).dataset['index']);
        const rect = (btn as HTMLElement).getBoundingClientRect();
        this.select(choices[index], rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
    });
  }

  private select(upgrade: Upgrade, cardX: number, cardY: number): void {
    if (!this.overlay) return;

    this.vfx.burstSelect(cardX, cardY, upgrade.rarity);
    this.overlay.classList.add('closing');
    const cb = this.onChoice;

    setTimeout(() => {
      this.destroy();
      cb?.(upgrade);
    }, 280);
  }
}
