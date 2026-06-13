import { GAME_STORY_COPY } from './content/game-narrative';

const STORAGE_KEY = 'resume-site-game-tutorial-v1';

export class GameTutorial {
  private overlay: HTMLElement | null = null;
  private stepIndex = 0;

  showIfNeeded(): void {
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      localStorage.setItem(STORAGE_KEY, '1');
      return;
    }

    setTimeout(() => this.open(), 1800);
  }

  /** Re-open tutorial (e.g. from command palette). */
  show(): void {
    this.open();
  }

  destroy(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  private open(): void {
    this.stepIndex = 0;
    this.overlay = document.createElement('div');
    this.overlay.className = 'game-tutorial-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'How to play');
    document.body.appendChild(this.overlay);
    this.renderStep();
    requestAnimationFrame(() => this.overlay?.classList.add('visible'));
  }

  private renderStep(): void {
    if (!this.overlay) return;

    const steps = GAME_STORY_COPY.tutorialSteps;
    const step = steps[this.stepIndex];
    const isLast = this.stepIndex === steps.length - 1;

    this.overlay.innerHTML = `
      <div class="game-tutorial-card">
        <div class="game-tutorial-progress" aria-hidden="true">
          ${steps.map((_, i) => `<span class="game-tutorial-dot${i === this.stepIndex ? ' active' : ''}"></span>`).join('')}
        </div>
        <h2 class="game-tutorial-title">${step.title}</h2>
        <p class="game-tutorial-body">${step.body}</p>
        <div class="game-tutorial-actions">
          ${this.stepIndex > 0 ? '<button type="button" class="link-btn game-tutorial-back">Back</button>' : ''}
          <button type="button" class="link-btn game-tutorial-next">${isLast ? 'Start playing' : 'Next'}</button>
        </div>
        <button type="button" class="game-tutorial-skip">Skip tutorial</button>
      </div>
    `;

    this.overlay.querySelector('.game-tutorial-next')?.addEventListener('click', () => {
      if (isLast) {
        this.dismiss();
        return;
      }
      this.stepIndex++;
      this.renderStep();
    });

    this.overlay.querySelector('.game-tutorial-back')?.addEventListener('click', () => {
      this.stepIndex = Math.max(0, this.stepIndex - 1);
      this.renderStep();
    });

    this.overlay.querySelector('.game-tutorial-skip')?.addEventListener('click', () => this.dismiss());
  }

  private dismiss(): void {
    localStorage.setItem(STORAGE_KEY, '1');
    if (!this.overlay) return;
    this.overlay.classList.remove('visible');
    setTimeout(() => this.destroy(), 280);
  }
}
