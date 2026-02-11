// Keyboard shortcuts service for enhanced navigation
export class KeyboardShortcuts {
  private callbacks: Map<string, () => void> = new Map();
  private handler: ((e: KeyboardEvent) => void) | null = null;

  register(key: string, callback: () => void) {
    this.callbacks.set(key.toLowerCase(), callback);
  }

  init() {
    this.handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      const key = e.key.toLowerCase();
      const callback = this.callbacks.get(key);
      if (callback) {
        e.preventDefault();
        callback();
      }
    };
    document.addEventListener('keydown', this.handler);
  }

  destroy() {
    if (this.handler) {
      document.removeEventListener('keydown', this.handler);
      this.handler = null;
    }
    this.callbacks.clear();
  }
}
