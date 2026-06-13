// Keyboard shortcuts service for enhanced navigation
import { fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

export class KeyboardShortcuts {
  private callbacks: Map<string, () => void> = new Map();
  private readonly destroy$ = new Subject<void>();

  register(key: string, callback: () => void) {
    this.callbacks.set(key.toLowerCase(), callback);
  }

  init() {
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      filter((e) => {
        const tag = (e.target as HTMLElement).tagName;
        const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
        const ctrlOrMeta = e.ctrlKey || e.metaKey;
        if (ctrlOrMeta && e.key.toLowerCase() === 'k') return true;
        return !inInput;
      }),
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      if (ctrlOrMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const callback = this.callbacks.get('ctrl+k');
        if (callback) callback();
        return;
      }
      if (ctrlOrMeta) return;

      const key = e.key.toLowerCase();
      const callback = this.callbacks.get(key);
      if (callback) {
        e.preventDefault();
        callback();
      }
    });
  }

  destroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.callbacks.clear();
  }
}
