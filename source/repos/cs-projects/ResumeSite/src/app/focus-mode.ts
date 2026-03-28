// Focus mode: fades resume content when the player is engaged with the game

const OPACITY_TIERS = [
  { minScore: 0, opacity: 1.0 },
  { minScore: 5, opacity: 0.82 },
  { minScore: 10, opacity: 0.65 },
  { minScore: 15, opacity: 0.50 },
] as const;

const IDLE_RESTORE_MS = 12_000;
const TRANSITION_SPEED = 'opacity 1.2s ease, filter 1.2s ease';

export class FocusMode {
  private toggle: HTMLElement | null = null;
  private manualMode: 'game' | 'resume' | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private currentScore = 0;

  init(): void {
    this.toggle = this.buildToggle();
    document.body.appendChild(this.toggle);
    this.applyResumeOpacity();
  }

  onScore(sessionScore: number): void {
    this.currentScore = sessionScore;
    this.resetIdleTimer();

    if (this.manualMode === 'resume') return;
    this.applyResumeOpacity();
  }

  destroy(): void {
    this.toggle?.remove();
    this.toggle = null;
    this.clearIdleTimer();
    this.resetResumeStyles();
  }

  private buildToggle(): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'focus-toggle';
    btn.textContent = '🎮';
    btn.title = 'Toggle: Game / Resume focus';
    btn.addEventListener('click', () => this.handleToggleClick());
    return btn;
  }

  private handleToggleClick(): void {
    if (this.manualMode === 'game') {
      this.manualMode = 'resume';
      this.resetResumeStyles();
      this.updateToggleLabel();
      return;
    }

    this.manualMode = 'game';
    this.applyGameFocus();
    this.updateToggleLabel();
  }

  private updateToggleLabel(): void {
    if (!this.toggle) return;
    this.toggle.textContent = this.manualMode === 'game' ? '📄' : '🎮';
    this.toggle.title = this.manualMode === 'game'
      ? 'Switch to Resume focus'
      : 'Switch to Game focus';
  }

  private applyResumeOpacity(): void {
    const tier = this.resolveOpacityTier();
    this.setResumeElements(tier.opacity);
  }

  private applyGameFocus(): void {
    this.setResumeElements(0.35);
  }

  private resolveOpacityTier(): { minScore: number; opacity: number } {
    let result: { minScore: number; opacity: number } = OPACITY_TIERS[0];
    for (const tier of OPACITY_TIERS) {
      if (this.currentScore < tier.minScore) break;
      result = tier;
    }
    return result;
  }

  private setResumeElements(opacity: number): void {
    const selectors = [
      '.resume-header',
      '.resume-main',
      '.resume-footer',
    ];

    for (const sel of selectors) {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) continue;
      el.style.transition = TRANSITION_SPEED;
      el.style.opacity = String(opacity);
      el.style.filter = opacity < 0.8 ? `blur(${(1 - opacity) * 2}px)` : '';
    }
  }

  private resetResumeStyles(): void {
    this.setResumeElements(1.0);
  }

  private resetIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => this.onIdle(), IDLE_RESTORE_MS);
  }

  private clearIdleTimer(): void {
    if (!this.idleTimer) return;
    clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  private onIdle(): void {
    if (this.manualMode === 'game') return;
    this.resetResumeStyles();
  }
}
