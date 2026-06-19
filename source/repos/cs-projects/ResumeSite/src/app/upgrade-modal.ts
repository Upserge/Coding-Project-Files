// Milestone upgrade picker — studio modal with rarity-styled choice cards

import { Upgrade, getCategoryIcon, pickRandomUpgrades, RARITY_COLORS, RARITY_LABELS } from './upgrade-registry';
import { UpgradeVFX } from './upgrade-vfx';
import { getUpgradeFlavor } from './content/game-narrative';

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
    overlay.className = 'studio-modal-overlay upgrade-overlay';
    overlay.setAttribute('role', 'presentation');
    overlay.innerHTML = this.buildHTML(choices);
    this.bindButtons(overlay, choices);
    return overlay;
  }

  private buildHTML(choices: Upgrade[]): string {
    const cards = choices.map((u, i) => this.buildCardHTML(u, i)).join('');

    return `
      <div class="studio-modal" role="dialog" aria-labelledby="upgrade-modal-title" aria-modal="true">
        <header class="studio-modal-header">
          <div>
            <span class="studio-modal-kicker">Milestone</span>
            <h3 id="upgrade-modal-title">Choose an upgrade</h3>
          </div>
        </header>
        <div class="studio-modal-body upgrade-body">
          <p class="upgrade-lead">Pick one enhancement for this run.</p>
          <div class="upgrade-cards">${cards}</div>
        </div>
        <p class="studio-modal-foot">Duplicates stack until each upgrade reaches its max.</p>
      </div>
    `;
  }

  private buildCardHTML(u: Upgrade, index: number): string {
    const color = RARITY_COLORS[u.rarity];
    const label = RARITY_LABELS[u.rarity];
    const flavor = getUpgradeFlavor(u.id);
    const flavorHtml = flavor ? `<span class="upgrade-flavor">${flavor}</span>` : '';

    return `
      <button
        type="button"
        class="upgrade-card rarity-${u.rarity}"
        data-index="${index}"
        style="--card-delay: ${index * 0.06}s; --rarity-color: ${color}"
      >
        <span class="upgrade-rarity-badge" style="color: ${color}; border-color: ${color}">${label}</span>
        <span class="upgrade-icon" aria-hidden="true">${getCategoryIcon(u.category)}</span>
        <span class="upgrade-name">${u.name}</span>
        <span class="upgrade-desc">${u.description}</span>
        ${flavorHtml}
        <span class="upgrade-category">${u.category}</span>
      </button>
    `;
  }

  private bindButtons(overlay: HTMLElement, choices: Upgrade[]): void {
    overlay.querySelectorAll('.upgrade-card').forEach((btn) => {
      btn.addEventListener('click', () => {
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
