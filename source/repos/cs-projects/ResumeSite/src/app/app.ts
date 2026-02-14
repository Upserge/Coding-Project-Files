import { Component, signal, computed, inject } from '@angular/core';
import { ResumeService } from './resume-service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Toast } from './toast';
import { KeyboardHintsModal } from './keyboard-hints-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  // Inject the service which manages all business logic
  private readonly resumeService = inject(ResumeService);
  private readonly sanitizer = inject(DomSanitizer);
  private keyboardHintsModal: KeyboardHintsModal | null = null;

  // ===== Expose Service Signals =====
  // UI State from service
  protected readonly isDarkMode = computed(() => this.resumeService.isDarkMode());
  protected readonly activeSection = computed(() => this.resumeService.activeSection());
  protected readonly isNavHidden = computed(() => this.resumeService.isNavHidden());
  protected readonly highlightedSection = this.resumeService.highlightedSection;
  protected readonly score = computed(() => this.resumeService.score());

  // Resume Data from service
  protected readonly title = signal('Jason Salas');
  protected readonly resume = signal(this.resumeService.getResume());

  // Typewriter
  protected readonly typedRole = signal('');
  private readonly roles = ['Software Developer', 'Full-Stack Engineer', 'QA Engineer', 'Problem Solver', 'Regular Dude'];
  private roleIndex = 0;
  private charIndex = 0;
  private isDeleting = false;
  private typeTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly contact = computed(() => this.resume().contact);
  protected readonly links = computed(() => this.resume().links);
  protected readonly technologies = computed(() => this.resume().technologies);

  // ===== Component Lifecycle =====
  constructor() {
    // Initialize service observers and animations
    setTimeout(() => {
      this.resumeService.initReveal();
      this.resumeService.initActiveSectionObserver();
      this.resumeService.initScrollListener();
      this.resumeService.initLottie();

      // Initialize advanced effects
      this.resumeService.initCursorSpotlight();
      this.resumeService.initMagneticButtons();
      this.resumeService.initParticleField();
      this.resumeService.initLeaderboard();
      this.initKeyboardShortcuts();
    }, 120);

    // Enable View Transitions API for theme changes
    if ((document as any).startViewTransition) {
      this.enableViewTransitions();
    }

    // Start typewriter after letter animations finish
    setTimeout(() => this.typewriterTick(), 1200);
  }

  private typewriterTick() {
    const current = this.roles[this.roleIndex];
    if (this.isDeleting) {
      this.charIndex--;
      this.typedRole.set(current.substring(0, this.charIndex));
      if (this.charIndex === 0) {
        this.isDeleting = false;
        this.roleIndex = (this.roleIndex + 1) % this.roles.length;
        this.typeTimer = setTimeout(() => this.typewriterTick(), 400);
        return;
      }
      this.typeTimer = setTimeout(() => this.typewriterTick(), 35);
    } else {
      this.charIndex++;
      this.typedRole.set(current.substring(0, this.charIndex));
      if (this.charIndex === current.length) {
        this.isDeleting = true;
        this.typeTimer = setTimeout(() => this.typewriterTick(), 2200);
        return;
      }
      this.typeTimer = setTimeout(() => this.typewriterTick(), 70);
    }
  }

  private initKeyboardShortcuts() {
    this.resumeService.initKeyboardShortcuts({
      'd': () => this.toggleDarkMode(),
      'j': () => this.resumeService.scrollTo('summary'),
      'k': () => this.resumeService.scrollTo('technologies'),
      'l': () => this.resumeService.scrollTo('experience'),
      ';': () => this.resumeService.scrollTo('projects'),
      '?': () => this.showKeyboardHints(),
      'Escape': () => this.closeKeyboardHints(),
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

  ngOnDestroy(): void {
    this.resumeService.dispose();
    this.keyboardHintsModal?.destroy();
    if (this.typeTimer) clearTimeout(this.typeTimer);
  }
}
