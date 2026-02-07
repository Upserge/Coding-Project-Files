// Keyboard shortcuts service for enhanced navigation
export class KeyboardShortcuts {
  private callbacks: Map<string, () => void> = new Map();

  register(key: string, callback: () => void) {
    this.callbacks.set(key.toLowerCase(), callback);
  }

  init() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      const key = e.key.toLowerCase();
      const callback = this.callbacks.get(key);
      if (callback) {
        e.preventDefault();
        callback();
      }
    });
  }

  destroy() {
    this.callbacks.clear();
  }
}
