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
    this.overlay.className = 'studio-modal-overlay game-tutorial-overlay';
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
    const stepLabel = `${this.stepIndex + 1} / ${steps.length}`;

    this.overlay.innerHTML = `
      <div class="studio-modal game-tutorial-modal">
        <div class="studio-modal-header">
          <div>
            <span class="studio-modal-kicker">Tutorial · ${stepLabel}</span>
            <h3>${step.title}</h3>
          </div>
        </div>
        <div class="studio-modal-body game-tutorial-body-wrap">
          <p class="game-tutorial-body">${step.body}</p>
          <div class="game-tutorial-progress" aria-hidden="true">
            ${steps.map((_, i) => `<span class="game-tutorial-dot${i === this.stepIndex ? ' active' : ''}"></span>`).join('')}
          </div>
        </div>
        <div class="studio-modal-actions game-tutorial-actions">
          ${this.stepIndex > 0 ? '<button type="button" class="link-btn game-tutorial-back">Back</button>' : ''}
          <button type="button" class="studio-btn-primary game-tutorial-next">${isLast ? 'Start playing' : 'Next'}</button>
        </div>
        <p class="studio-modal-foot">
          <button type="button" class="game-tutorial-skip">Skip tutorial</button>
        </p>
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
    this.overlay.classList.add('closing');
    this.overlay.classList.remove('visible');
    setTimeout(() => this.destroy(), 280);
  }
}
