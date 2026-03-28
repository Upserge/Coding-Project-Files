// Collapsible sticky panel showing acquired upgrades with stack counts

import { Upgrade, UPGRADE_POOL, RARITY_COLORS, RARITY_LABELS, getCategoryIcon, UpgradeRarity } from './upgrade-registry';

export class UpgradeInventory {
  private panel: HTMLElement | null = null;
  private listEl: HTMLElement | null = null;
  private badgeEl: HTMLElement | null = null;
  private collapsed = true;

  init(): void {
    this.panel = this.buildPanel();
    document.body.appendChild(this.panel);
  }

  refresh(stacks: ReadonlyMap<string, number>): void {
    if (!this.listEl || !this.badgeEl) return;

    const acquired = this.getAcquiredUpgrades(stacks);
    this.badgeEl.textContent = String(acquired.length);
    this.badgeEl.style.display = acquired.length > 0 ? 'flex' : 'none';
    this.listEl.innerHTML = this.buildListHTML(acquired, stacks);
  }

  destroy(): void {
    this.panel?.remove();
    this.panel = null;
    this.listEl = null;
    this.badgeEl = null;
  }

  private buildPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'upgrade-inventory collapsed';

    const toggle = document.createElement('button');
    toggle.className = 'inventory-toggle';
    toggle.innerHTML = '<span class="inventory-icon">🛡️</span><span class="inventory-label">Upgrades</span>';
    toggle.addEventListener('click', () => this.toggleCollapse());

    this.badgeEl = document.createElement('span');
    this.badgeEl.className = 'inventory-badge';
    this.badgeEl.style.display = 'none';
    toggle.appendChild(this.badgeEl);

    this.listEl = document.createElement('div');
    this.listEl.className = 'inventory-list';

    panel.appendChild(toggle);
    panel.appendChild(this.listEl);
    return panel;
  }

  private toggleCollapse(): void {
    if (!this.panel) return;
    this.collapsed = !this.collapsed;
    this.panel.classList.toggle('collapsed', this.collapsed);
  }

  private getAcquiredUpgrades(stacks: ReadonlyMap<string, number>): Upgrade[] {
    return UPGRADE_POOL.filter(u => (stacks.get(u.id) ?? 0) > 0);
  }

  private buildListHTML(upgrades: Upgrade[], stacks: ReadonlyMap<string, number>): string {
    if (upgrades.length === 0) {
      return '<div class="inventory-empty">No upgrades yet</div>';
    }

    return upgrades
      .map(u => this.buildItemHTML(u, stacks.get(u.id) ?? 0))
      .join('');
  }

  private buildItemHTML(upgrade: Upgrade, count: number): string {
    const color = RARITY_COLORS[upgrade.rarity];
    const rarityLabel = RARITY_LABELS[upgrade.rarity];
    const icon = getCategoryIcon(upgrade.category);
    const stackLabel = count >= upgrade.maxStacks ? 'MAX' : `${count}/${upgrade.maxStacks}`;
    const maxed = count >= upgrade.maxStacks ? ' maxed' : '';

    return `
      <div class="inventory-item${maxed}" style="--rarity-color: ${color}">
        <span class="item-icon">${icon}</span>
        <div class="item-info">
          <span class="item-name">${upgrade.name}</span>
          <span class="item-rarity" style="color: ${color}">${rarityLabel}</span>
        </div>
        <span class="item-stacks">${stackLabel}</span>
      </div>`;
  }
}
