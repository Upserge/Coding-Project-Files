import { Component, computed, inject, afterNextRender, DestroyRef, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { ResumeService } from './resume-service';
import { KeyboardHintsModal } from './keyboard-hints-modal';
import { CommandPalette } from './command-palette';
import { applyVisualTier } from './content/visual-tier';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  private readonly resumeService = inject(ResumeService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private keyboardHintsModal: KeyboardHintsModal | null = null;
  private commandPalette: CommandPalette | null = null;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isDarkMode = computed(() => this.resumeService.isDarkMode());
  protected readonly highlightedSection = this.resumeService.highlightedSection;
  protected readonly score = computed(() => this.resumeService.score());
  protected readonly isHome = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url === '';
  });

  constructor() {
    effect(() => {
      this.currentUrl();
      this.resumeService.refreshParticleFieldLayoutAfterRoute();
    });

    afterNextRender(() => {
      this.resumeService.initScrollListener();
      this.resumeService.initCursorSpotlight();
      this.resumeService.initMagneticButtons();
      this.resumeService.initShaderHero();
      this.resumeService.initParticleField();
      this.resumeService.initLeaderboard();
      this.resumeService.initFocusMode();
      this.initCommandPalette();
      this.initKeyboardShortcuts();
    });

    if ((document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition) {
      this.enableViewTransitions();
    }

    this.destroyRef.onDestroy(() => {
      this.resumeService.dispose();
      this.keyboardHintsModal?.destroy();
      this.commandPalette?.destroy();
    });
  }

  private initCommandPalette(): void {
    this.commandPalette = new CommandPalette();
    this.commandPalette.init([
      { id: 'work', label: 'Go to Selected work', hint: 'W', run: () => this.resumeService.scrollTo('work') },
      { id: 'summary', label: 'Go to Summary', hint: 'J', run: () => this.resumeService.scrollTo('summary') },
      { id: 'technologies', label: 'Go to Technologies', hint: 'K', run: () => this.resumeService.scrollTo('technologies') },
      { id: 'experience', label: 'Go to Experience', hint: 'L', run: () => this.resumeService.scrollTo('experience') },
      { id: 'projects', label: 'Go to Projects', hint: ';', run: () => this.resumeService.scrollTo('projects') },
      {
        id: 'valorant',
        label: 'Read VALORANT case study',
        run: () => void this.router.navigate(['/work/riot-valorant']),
      },
      {
        id: 'resume-site',
        label: 'Read Resume Site case study',
        run: () => void this.router.navigate(['/work/resume-site']),
      },
      {
        id: 'about',
        label: 'About Jason',
        run: () => void this.router.navigate(['/about']),
      },
      { id: 'game-story', label: 'How to play the background game', run: () => this.goToGameStory() },
      { id: 'tutorial', label: 'Show game tutorial', run: () => this.resumeService.showGameTutorial() },
      { id: 'email', label: 'Copy email address', run: () => void this.resumeService.copyEmail() },
      { id: 'theme', label: 'Toggle dark / light mode', hint: 'D', run: () => this.toggleDarkMode() },
      { id: 'leaderboard', label: 'Open leaderboard', hint: 'S', run: () => this.showLeaderboard() },
      { id: 'shortcuts', label: 'Keyboard shortcuts', hint: '?', run: () => this.showKeyboardHints() },
    ]);
  }

  private goToGameStory(): void {
    const onHome = this.isHome();
    if (!onHome) {
      void this.router.navigate(['/']).then(() => {
        setTimeout(() => this.resumeService.scrollTo('game-story'), 120);
      });
      return;
    }
    this.resumeService.scrollTo('game-story');
  }

  private initKeyboardShortcuts() {
    this.resumeService.initKeyboardShortcuts({
      d: () => this.toggleDarkMode(),
      w: () => this.resumeService.scrollTo('work'),
      j: () => this.resumeService.scrollTo('summary'),
      k: () => this.resumeService.scrollTo('technologies'),
      l: () => this.resumeService.scrollTo('experience'),
      ';': () => this.resumeService.scrollTo('projects'),
      s: () => this.showLeaderboard(),
      '?': () => this.showKeyboardHints(),
      'ctrl+k': () => this.commandPalette?.show(),
      Escape: () => {
        this.commandPalette?.close();
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
    applyVisualTier();
  }

  showLeaderboard() {
    this.resumeService.showLeaderboard();
  }

  closeLeaderboard() {
    this.resumeService.closeLeaderboard();
  }
}
