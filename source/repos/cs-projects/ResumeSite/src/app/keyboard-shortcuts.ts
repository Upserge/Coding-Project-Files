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
      filter(e => (e.target as HTMLElement).tagName !== 'INPUT'),
      takeUntil(this.destroy$)
    ).subscribe(e => {
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
