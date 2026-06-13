// Magnetic button effect that pulls towards cursor
export class MagneticButtons {
  private listeners: { btn: HTMLElement; move: (e: Event) => void; leave: () => void }[] = [];

  init() {
    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>('.link-btn, .tech-chip, .project-card-link, button:not([type])'),
    );

    buttons.forEach((btn) => {
      const move = (e: Event) => this.onMouseMove(e as MouseEvent, btn);
      const leave = () => this.resetTransform(btn);
      btn.addEventListener('mousemove', move);
      btn.addEventListener('mouseleave', leave);
      this.listeners.push({ btn, move, leave });
    });
  }

  private getMagneticTarget(btn: HTMLElement): HTMLElement {
    return btn.querySelector<HTMLElement>('.magnetic-inner') ?? btn;
  }

  private onMouseMove(e: MouseEvent, btn: HTMLElement) {
    const target = this.getMagneticTarget(btn);
    const rect = btn.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const distance = 50;
    const dx = e.clientX - btnCenterX;
    const dy = e.clientY - btnCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < distance && dist > 0) {
      const force = (1 - dist / distance) * 8;
      const tx = (dx / dist) * force;
      const ty = (dy / dist) * force;
      target.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  }

  private resetTransform(btn: HTMLElement) {
    const target = this.getMagneticTarget(btn);
    target.style.transform = '';
  }

  destroy() {
    this.listeners.forEach(({ btn, move, leave }) => {
      btn.removeEventListener('mousemove', move);
      btn.removeEventListener('mouseleave', leave);
      this.resetTransform(btn);
    });
    this.listeners = [];
  }
}
