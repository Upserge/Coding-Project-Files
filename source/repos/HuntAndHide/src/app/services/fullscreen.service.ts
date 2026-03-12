import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FullscreenService {
  private target: HTMLElement | null = null;
  protected readonly active = signal(false);

  constructor() {
    document.addEventListener('fullscreenchange', this.syncState);
  }

  readonly isActive = this.active.asReadonly();

  registerTarget(element: HTMLElement): void {
    this.target = element;
    this.syncState();
  }

  async toggle(): Promise<void> {
    return this.isActive() ? this.exit() : this.enter();
  }

  async enter(): Promise<void> {
    const target = this.target;
    if (!target) return;
    await target.requestFullscreen().catch(() => {});
  }

  async exit(): Promise<void> {
    if (!document.fullscreenElement) return;
    await document.exitFullscreen().catch(() => {});
  }

  private readonly syncState = (): void => {
    this.active.set(document.fullscreenElement === this.target);
  };
}
