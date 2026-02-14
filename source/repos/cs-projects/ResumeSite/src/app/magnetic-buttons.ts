// Magnetic button effect that pulls towards cursor
export class MagneticButtons {
  private buttons: HTMLElement[] = [];

  init() {
    this.buttons = Array.from(document.querySelectorAll('.link-btn, .tech-chip, button:not([type])'));
    
    this.buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => this.onMouseMove(e, btn));
      btn.addEventListener('mouseleave', (e) => this.onMouseLeave(e, btn));
    });
  }

  private onMouseMove(e: MouseEvent, btn: HTMLElement) {
    const rect = btn.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const distance = 50; // magnetic range
    const dx = mouseX - btnCenterX;
    const dy = mouseY - btnCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < distance) {
      const force = (1 - dist / distance) * 8; // max 8px pull
      const tx = (dx / dist) * force;
      const ty = (dy / dist) * force;
      btn.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  }

  private onMouseLeave(e: MouseEvent, btn: HTMLElement) {
    btn.style.transform = '';
  }

  destroy() {
    this.buttons.forEach((btn) => {
      btn.style.transform = '';
    });
    this.buttons = [];
  }
}
