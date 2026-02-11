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
  protected readonly selectedTechnologies = this.resumeService.selectedTechnologies;

  // Resume Data from service
  protected readonly title = signal('Jason Salas');
  protected readonly resume = signal(this.resumeService.getResume());

  protected readonly contact = computed(() => this.resume().contact);
  protected readonly links = computed(() => this.resume().links);
  protected readonly technologies = computed(() => this.resume().technologies);

  protected readonly isTechSelected = (tech: string) => this.resumeService.isTechSelected(tech);

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
      this.initKeyboardShortcuts();
    }, 120);

    // Enable View Transitions API for theme changes
    if ((document as any).startViewTransition) {
      this.enableViewTransitions();
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

  ngOnDestroy(): void {
    this.resumeService.dispose();
    this.keyboardHintsModal?.destroy();
  }
}
