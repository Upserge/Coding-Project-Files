// Cursor-following spotlight effect for interactive depth
export class CursorSpotlight {
  private spotlightEl: HTMLElement | null = null;

  init() {
    // Create spotlight element
    this.spotlightEl = document.createElement('div');
    this.spotlightEl.id = 'cursor-spotlight';
    this.spotlightEl.style.cssText = `
      position: fixed;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(124,92,255,0.2) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1;
      mix-blend-mode: screen;
      filter: blur(30px);
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
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
  }

  destroy() {
    this.spotlightEl?.remove();
    this.spotlightEl = null;
  }
}
