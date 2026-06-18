// Keyboard hints — cinematic modal overlay

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ['W'], label: 'Selected work' },
  { keys: ['Ctrl', 'K'], label: 'Command palette' },
  { keys: ['J'], label: 'Summary' },
  { keys: ['K'], label: 'Technologies' },
  { keys: ['L'], label: 'Experience' },
  { keys: [';'], label: 'Projects' },
  { keys: ['D'], label: 'Dark mode' },
  { keys: ['S'], label: 'Leaderboard' },
  { keys: ['?'], label: 'This panel' },
  { keys: ['Esc'], label: 'Close overlays' },
];

export class KeyboardHintsModal {
  private overlay: HTMLElement | null = null;

  show() {
    if (this.overlay) {
      this.overlay.classList.add('visible');
      return;
    }

    this.overlay = document.createElement('div');
    this.overlay.className = 'studio-modal-overlay keyboard-hints-overlay';
    this.overlay.innerHTML = `
      <div class="studio-modal" role="dialog" aria-labelledby="keyboard-hints-title">
        <header class="studio-modal-header">
          <div>
            <span class="studio-modal-kicker">Controls</span>
            <h3 id="keyboard-hints-title">Keyboard shortcuts</h3>
          </div>
          <button type="button" class="studio-modal-close" aria-label="Close">✕</button>
        </header>
        <div class="studio-modal-body">
          <div class="shortcut-grid">
            ${SHORTCUTS.map(
              (s) => `
              <div class="shortcut-item">
                <span class="shortcut-label">${s.label}</span>
                <span class="shortcut-keys">${s.keys.map((k) => `<kbd>${k}</kbd>`).join('')}</span>
              </div>`,
            ).join('')}
          </div>
        </div>
        <p class="studio-modal-foot">Press <strong>?</strong> anytime to reopen</p>
      </div>
    `;

    document.body.appendChild(this.overlay);
    requestAnimationFrame(() => this.overlay?.classList.add('visible'));

    this.overlay.querySelector('.studio-modal-close')?.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('visible');
    setTimeout(() => {
      this.overlay?.remove();
      this.overlay = null;
    }, 220);
  }

  destroy() {
    this.close();
  }
}
