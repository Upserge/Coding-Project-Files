import { Directive, ElementRef, inject, Input, AfterViewInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appAos]',
  standalone: true,
})
export class AosDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  /** Unused legacy input — kept for template compatibility */
  @Input() appAos = '';

  /** Delay string (e.g. 'delay-200' → 0.2s transition-delay) */
  @Input() aosDelay = '';

  /** IntersectionObserver threshold (0–1) */
  @Input() aosThreshold = 0.15;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const element = this.el.nativeElement as HTMLElement;

    // Apply transition-delay from the shorthand 'delay-XXX' input
    if (this.aosDelay) {
      const ms = parseInt(this.aosDelay.replace('delay-', ''), 10);
      if (!isNaN(ms)) {
        element.style.transitionDelay = `${ms / 1000}s`;
      }
    }

    // Start hidden via CSS class (transition properties defined in styles.css)
    element.classList.add('aos-init');

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Reveal: add animate class which transitions opacity + transform
          element.classList.add('aos-animate');
          this.observer?.unobserve(element);
        }
      },
      { threshold: this.aosThreshold },
    );

    // Double-rAF: the first frame commits the aos-init hidden state to a
    // real browser paint; the second frame starts observing after that paint
    // is on screen, so the transition from hidden → visible is always visible.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.observer?.observe(element);
      });
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
