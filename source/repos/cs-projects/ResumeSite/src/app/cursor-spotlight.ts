// Cursor-following spotlight effect for interactive depth
export class CursorSpotlight {
  private spotlightEl: HTMLElement | null = null;
  private themeObserver: MutationObserver | null = null;

  init() {
    // Create spotlight element
    this.spotlightEl = document.createElement('div');
    this.spotlightEl.id = 'cursor-spotlight';
    this.spotlightEl.style.cssText = `
      position: fixed;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      filter: blur(30px);
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    this.applyTheme();
    document.body.appendChild(this.spotlightEl);

    document.addEventListener('mousemove', (e) => {
      if (!this.spotlightEl) return;
      this.spotlightEl.style.left = e.clientX + 'px';
      this.spotlightEl.style.top = e.clientY + 'px';
      this.spotlightEl.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
      if (this.spotlightEl) {
        this.spotlightEl.style.opacity = '0';
      }
    });

    // Watch for theme changes
    this.themeObserver = new MutationObserver(() => this.applyTheme());
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  private applyTheme() {
    if (!this.spotlightEl) return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      this.spotlightEl.style.background = 'radial-gradient(circle, rgba(100,60,200,0.18) 0%, transparent 70%)';
      this.spotlightEl.style.mixBlendMode = 'multiply';
    } else {
      this.spotlightEl.style.background = 'radial-gradient(circle, rgba(124,92,255,0.2) 0%, transparent 70%)';
      this.spotlightEl.style.mixBlendMode = 'screen';
    }
  }

  destroy() {
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    this.spotlightEl?.remove();
    this.spotlightEl = null;
  }
}
