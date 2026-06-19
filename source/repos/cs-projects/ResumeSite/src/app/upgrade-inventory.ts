// Collapsible HUD panel showing acquired upgrades with stack counts

import { Upgrade, UPGRADE_POOL, RARITY_COLORS, RARITY_LABELS, getCategoryIcon } from './upgrade-registry';

export class UpgradeInventory {
  private panel: HTMLElement | null = null;
  private listEl: HTMLElement | null = null;
  private badgeEl: HTMLElement | null = null;
  private collapsed = true;

  init(): void {
    this.panel = this.buildPanel();
    document.body.appendChild(this.panel);
    this.hide();
  }

  show(): void {
    if (!this.panel) return;
    this.panel.style.display = 'block';
  }

  hide(): void {
    if (!this.panel) return;
    this.panel.style.display = 'none';
  }

  refresh(stacks: ReadonlyMap<string, number>): void {
    if (!this.listEl || !this.badgeEl) return;

    const acquired = this.getAcquiredUpgrades(stacks);
    this.badgeEl.textContent = String(acquired.length);
    this.badgeEl.hidden = acquired.length === 0;
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
    toggle.type = 'button';
    toggle.className = 'inventory-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'upgrade-inventory-list');
    toggle.title = 'Show acquired upgrades';

    const label = document.createElement('span');
    label.className = 'inventory-label';
    label.textContent = 'Upgrades';

    this.badgeEl = document.createElement('span');
    this.badgeEl.className = 'inventory-badge';
    this.badgeEl.hidden = true;

    const chevron = document.createElement('span');
    chevron.className = 'inventory-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '▾';

    toggle.append(label, this.badgeEl, chevron);
    toggle.addEventListener('click', () => this.toggleCollapse());

    const drop = document.createElement('div');
    drop.className = 'inventory-drop';

    this.listEl = document.createElement('div');
    this.listEl.className = 'inventory-list';
    this.listEl.id = 'upgrade-inventory-list';

    drop.appendChild(this.listEl);
    panel.append(toggle, drop);
    return panel;
  }

  private toggleCollapse(): void {
    if (!this.panel) return;
    this.collapsed = !this.collapsed;
    this.panel.classList.toggle('collapsed', this.collapsed);
    const toggle = this.panel.querySelector('.inventory-toggle');
    toggle?.setAttribute('aria-expanded', String(!this.collapsed));
  }

  private getAcquiredUpgrades(stacks: ReadonlyMap<string, number>): Upgrade[] {
    return UPGRADE_POOL.filter(u => (stacks.get(u.id) ?? 0) > 0);
  }

  private buildListHTML(upgrades: Upgrade[], stacks: ReadonlyMap<string, number>): string {
    if (upgrades.length === 0) {
      return '<div class="inventory-empty">No upgrades yet — score milestones to add enhancements.</div>';
    }

    return upgrades.map(u => this.buildItemHTML(u, stacks.get(u.id) ?? 0)).join('');
  }

  private buildItemHTML(upgrade: Upgrade, count: number): string {
    const color = RARITY_COLORS[upgrade.rarity];
    const rarityLabel = RARITY_LABELS[upgrade.rarity];
    const icon = getCategoryIcon(upgrade.category);
    const stackLabel = count >= upgrade.maxStacks ? 'MAX' : `${count}/${upgrade.maxStacks}`;
    const maxed = count >= upgrade.maxStacks ? ' inventory-item--maxed' : '';

    return `
      <div class="inventory-item${maxed}" style="--rarity-color: ${color}">
        <span class="inventory-item-icon" aria-hidden="true">${icon}</span>
        <div class="inventory-item-info">
          <span class="inventory-item-name">${upgrade.name}</span>
          <span class="inventory-item-rarity" style="color: ${color}">${rarityLabel}</span>
        </div>
        <span class="inventory-item-stacks">${stackLabel}</span>
      </div>`;
  }
}
