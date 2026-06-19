export interface CommandPaletteAction {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly run: () => void;
}

export class CommandPalette {
  private overlay: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private list: HTMLElement | null = null;
  private actions: CommandPaletteAction[] = [];
  private filtered: CommandPaletteAction[] = [];
  private activeIndex = 0;

  init(actions: CommandPaletteAction[]): void {
    this.actions = actions;
  }

  show(): void {
    if (!this.overlay) {
      this.overlay = this.buildOverlay();
      document.body.appendChild(this.overlay);
    }

    this.filtered = [...this.actions];
    this.activeIndex = 0;
    if (this.input) {
      this.input.value = '';
    }
    this.renderList();
    this.overlay.classList.remove('closing');
    this.overlay.classList.add('visible');
    requestAnimationFrame(() => this.input?.focus());
  }

  close(): void {
    if (!this.overlay) return;
    this.overlay.classList.add('closing');
    this.overlay.classList.remove('visible');
  }

  destroy(): void {
    this.overlay?.remove();
    this.overlay = null;
    this.input = null;
    this.list = null;
  }

  private buildOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'studio-modal-overlay command-palette-overlay';
    overlay.innerHTML = `
      <div class="studio-modal command-palette-modal" role="dialog" aria-labelledby="command-palette-title">
        <header class="studio-modal-header">
          <div>
            <span class="studio-modal-kicker">Navigate</span>
            <h3 id="command-palette-title">Command palette</h3>
          </div>
          <button type="button" class="studio-modal-close command-palette-close" aria-label="Close">✕</button>
        </header>
        <div class="studio-modal-body command-palette-body">
          <input class="command-palette-input" type="text" placeholder="Jump to…" aria-label="Command search" />
          <ul class="command-palette-list" role="listbox"></ul>
        </div>
        <p class="studio-modal-foot">↑↓ navigate · Enter run · Esc close</p>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    overlay.querySelector('.command-palette-close')?.addEventListener('click', () => this.close());

    this.input = overlay.querySelector('.command-palette-input');
    this.list = overlay.querySelector('.command-palette-list');

    this.input?.addEventListener('input', () => this.onFilter());
    this.input?.addEventListener('keydown', (e) => this.onInputKeydown(e));

    return overlay;
  }

  private onFilter(): void {
    const query = (this.input?.value ?? '').trim().toLowerCase();
    this.filtered = query
      ? this.actions.filter((a) => a.label.toLowerCase().includes(query))
      : [...this.actions];
    this.activeIndex = 0;
    this.renderList();
  }

  private onInputKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.filtered.length - 1);
      this.renderList();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
      this.renderList();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const action = this.filtered[this.activeIndex];
      if (!action) return;
      this.close();
      action.run();
    }
  }

  private renderList(): void {
    if (!this.list) return;

    if (this.filtered.length === 0) {
      this.list.innerHTML = '<li class="command-palette-empty">No matches</li>';
      return;
    }

    this.list.innerHTML = this.filtered
      .map((action, i) => {
        const active = i === this.activeIndex ? ' active' : '';
        const hint = action.hint
          ? `<span class="command-palette-hint">${action.hint}</span>`
          : '';
        return `<li class="studio-stat-row command-palette-item${active}" role="option" data-index="${i}"><span class="studio-stat-label">${action.label}</span>${hint}</li>`;
      })
      .join('');

    this.list.querySelectorAll('.command-palette-item').forEach((el) => {
      el.addEventListener('click', () => {
        const index = Number((el as HTMLElement).dataset['index']);
        const action = this.filtered[index];
        if (!action) return;
        this.close();
        action.run();
      });
    });
  }
}
