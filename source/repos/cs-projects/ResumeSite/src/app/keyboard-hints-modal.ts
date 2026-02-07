// Keyboard hints widget - subtle popup overlay
export class KeyboardHintsModal {
  private widget: HTMLElement | null = null;

  show() {
    if (this.widget) {
      this.widget.classList.add('visible');
      return;
    }

    this.widget = document.createElement('div');
    this.widget.className = 'keyboard-hints-widget';
    this.widget.innerHTML = `
      <div class="widget-header">
        <h3>Keyboard Shortcuts</h3>
        <button class="widget-close" aria-label="Close">✕</button>
      </div>
      <div class="widget-body">
        <div class="shortcut-group">
          <div class="shortcut-item">
            <kbd>J</kbd>
            <span>Summary</span>
          </div>
          <div class="shortcut-item">
            <kbd>K</kbd>
            <span>Technologies</span>
          </div>
          <div class="shortcut-item">
            <kbd>L</kbd>
            <span>Experience</span>
          </div>
          <div class="shortcut-item">
            <kbd>;</kbd>
            <span>Projects</span>
          </div>
          <div class="shortcut-item">
            <kbd>D</kbd>
            <span>Dark Mode</span>
          </div>
          <div class="shortcut-item">
            <kbd>Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.widget);
    this.widget.classList.add('visible');

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.widget) return;

    const closeBtn = this.widget.querySelector('.widget-close');

    closeBtn?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  close() {
    if (this.widget) {
      this.widget.classList.remove('visible');
      setTimeout(() => {
        this.widget?.remove();
        this.widget = null;
      }, 300);
    }
  }

  destroy() {
    this.close();
  }
}
