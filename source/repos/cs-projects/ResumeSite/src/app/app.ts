import { Component, computed, inject, afterNextRender, DestroyRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ResumeService } from './resume-service';
import { KeyboardHintsModal } from './keyboard-hints-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  private readonly resumeService = inject(ResumeService);
  private readonly destroyRef = inject(DestroyRef);
  private keyboardHintsModal: KeyboardHintsModal | null = null;

  protected readonly isDarkMode = computed(() => this.resumeService.isDarkMode());
  protected readonly isNavHidden = computed(() => this.resumeService.isNavHidden());
  protected readonly highlightedSection = this.resumeService.highlightedSection;
  protected readonly score = computed(() => this.resumeService.score());

  constructor() {
    afterNextRender(() => {
      this.resumeService.initScrollListener();
      this.resumeService.initCursorSpotlight();
      this.resumeService.initMagneticButtons();
      this.resumeService.initParticleField();
      this.resumeService.initLeaderboard();
      this.resumeService.initFocusMode();
      this.initKeyboardShortcuts();
    });

    if ((document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition) {
      this.enableViewTransitions();
    }

    this.destroyRef.onDestroy(() => {
      this.resumeService.dispose();
      this.keyboardHintsModal?.destroy();
    });
  }

  private initKeyboardShortcuts() {
    this.resumeService.initKeyboardShortcuts({
      d: () => this.toggleDarkMode(),
      j: () => this.resumeService.scrollTo('summary'),
      k: () => this.resumeService.scrollTo('technologies'),
      l: () => this.resumeService.scrollTo('experience'),
      ';': () => this.resumeService.scrollTo('projects'),
      s: () => this.showLeaderboard(),
      '?': () => this.showKeyboardHints(),
      Escape: () => {
        this.closeKeyboardHints();
        this.closeLeaderboard();
      },
    });
  }

  private enableViewTransitions() {
    const originalToggleDarkMode = this.toggleDarkMode.bind(this);
    this.toggleDarkMode = () => {
      const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
      if (doc.startViewTransition) {
        doc.startViewTransition(() => {
          originalToggleDarkMode();
        });
      } else {
        originalToggleDarkMode();
      }
    };
  }

  showKeyboardHints() {
    if (!this.keyboardHintsModal) {
      this.keyboardHintsModal = new KeyboardHintsModal();
    }
    this.keyboardHintsModal.show();
  }

  private closeKeyboardHints() {
    this.keyboardHintsModal?.close();
  }

  scrollTo(id: string) {
    this.resumeService.scrollTo(id);
  }

  scrollToTop() {
    this.resumeService.scrollToTop();
  }

  toggleDarkMode() {
    this.resumeService.toggleDarkMode();
  }

  showLeaderboard() {
    this.resumeService.showLeaderboard();
  }

  closeLeaderboard() {
    this.resumeService.closeLeaderboard();
  }
}
