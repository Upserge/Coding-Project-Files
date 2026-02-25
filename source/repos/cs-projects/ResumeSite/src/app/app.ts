import { Component, signal, computed, inject, afterNextRender, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer, EMPTY } from 'rxjs';
import { expand } from 'rxjs/operators';
import { ResumeService } from './resume-service';
import { DomSanitizer } from '@angular/platform-browser';
import { Toast } from './toast';
import { KeyboardHintsModal } from './keyboard-hints-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  // Inject the service which manages all business logic
  private readonly resumeService = inject(ResumeService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private keyboardHintsModal: KeyboardHintsModal | null = null;

  // ===== Expose Service Signals =====
  // UI State from service
  protected readonly isDarkMode = computed(() => this.resumeService.isDarkMode());
  protected readonly isNavHidden = computed(() => this.resumeService.isNavHidden());
  protected readonly highlightedSection = this.resumeService.highlightedSection;
  protected readonly score = computed(() => this.resumeService.score());

  // Resume Data from service
  protected readonly resume = signal(this.resumeService.getResume());

  // Typewriter
  protected readonly typedRole = signal('');
  private readonly roles = ['Software Developer', 'Full-Stack Engineer', 'QA Engineer', 'Problem Solver', 'Regular Dude'];
  private roleIndex = 0;
  private charIndex = 0;
  private isDeleting = false;

  protected readonly contact = computed(() => this.resume().contact);
  protected readonly links = computed(() => this.resume().links);
  protected readonly technologies = computed(() => this.resume().technologies);

  // ===== Component Lifecycle =====
  constructor() {
    // Initialize service observers and animations after first render
    afterNextRender(() => {
      this.resumeService.initReveal();
      this.resumeService.initScrollListener();
      this.resumeService.initLottie();

      // Initialize advanced effects
      this.resumeService.initCursorSpotlight();
      this.resumeService.initMagneticButtons();
      this.resumeService.initParticleField();
      this.resumeService.initLeaderboard();
      this.initKeyboardShortcuts();
    });

    // Enable View Transitions API for theme changes
    if ((document as any).startViewTransition) {
      this.enableViewTransitions();
    }

    // Start typewriter after letter animations finish (RxJS-driven)
    timer(1200).pipe(
      expand(() => {
        const current = this.roles[this.roleIndex];
        if (this.isDeleting) {
          this.charIndex--;
          this.typedRole.set(current.substring(0, this.charIndex));
          if (this.charIndex === 0) {
            this.isDeleting = false;
            this.roleIndex = (this.roleIndex + 1) % this.roles.length;
            return timer(400);
          }
          return timer(35);
        } else {
          this.charIndex++;
          this.typedRole.set(current.substring(0, this.charIndex));
          if (this.charIndex === current.length) {
            this.isDeleting = true;
            return timer(2200);
          }
          return timer(70);
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private initKeyboardShortcuts() {
    this.resumeService.initKeyboardShortcuts({
      'd': () => this.toggleDarkMode(),
      'j': () => this.resumeService.scrollTo('summary'),
      'k': () => this.resumeService.scrollTo('technologies'),
      'l': () => this.resumeService.scrollTo('experience'),
      ';': () => this.resumeService.scrollTo('projects'),
      's': () => this.showLeaderboard(),
      '?': () => this.showKeyboardHints(),
      'Escape': () => {this.closeKeyboardHints(); this.closeLeaderboard(); },
    });
  }

  private enableViewTransitions() {
    const originalToggleDarkMode = this.toggleDarkMode.bind(this);
    this.toggleDarkMode = () => {
      if ((document as any).startViewTransition) {
        (document as any).startViewTransition(() => {
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

  // ===== User Interaction Handlers =====
  openLink(url: string) {
    window.open(url, '_blank', 'noopener');
  }

  async copyEmail() {
    try {
      await navigator.clipboard.writeText(this.contact().email);
      Toast.show('Email copied!');
    } catch (e) {
      Toast.show('Failed to copy email');
    }
  }

  scrollTo(id: string) {
    this.resumeService.scrollTo(id);
  }

  scrollToTop() {
    this.resumeService.scrollToTop();
  }

  // ===== Service Delegation Methods =====
  toggleDarkMode() {
    this.resumeService.toggleDarkMode();
  }

  getTechSVG(tech: string) {
    return this.sanitizer.bypassSecurityTrustHtml(this.resumeService.getTechSVG(tech));
  }

  getProjectSVG(title: string) {
    return this.sanitizer.bypassSecurityTrustHtml(this.resumeService.getProjectSVG(title));
  }

  openTechLink(tech: string) {
    const link = this.resumeService.getTechLink(tech);
    if (link) {
      this.openLink(link);
    }
  }

  showLeaderboard() {
    this.resumeService.showLeaderboard();
  }

  closeLeaderboard() {
    this.resumeService.closeLeaderboard();
    }

  ngOnDestroy(): void {
    this.resumeService.dispose();
    this.keyboardHintsModal?.destroy();
  }
}
