// Magnetic button effect that pulls towards cursor
export class MagneticButtons {
  private listeners: { btn: HTMLElement; move: (e: Event) => void; leave: () => void }[] = [];

  init() {
    const buttons = Array.from(document.querySelectorAll<HTMLElement>('.link-btn, .tech-chip, button:not([type])'));

    buttons.forEach((btn) => {
      const move = (e: Event) => this.onMouseMove(e as MouseEvent, btn);
      const leave = () => { btn.style.transform = ''; };
      btn.addEventListener('mousemove', move);
      btn.addEventListener('mouseleave', leave);
      this.listeners.push({ btn, move, leave });
    });
  }

  private onMouseMove(e: MouseEvent, btn: HTMLElement) {
    const rect = btn.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const distance = 50; // magnetic range
    const dx = e.clientX - btnCenterX;
    const dy = e.clientY - btnCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < distance) {
      const force = (1 - dist / distance) * 8; // max 8px pull
      const tx = (dx / dist) * force;
      const ty = (dy / dist) * force;
      btn.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  }

  destroy() {
    this.listeners.forEach(({ btn, move, leave }) => {
      btn.removeEventListener('mousemove', move);
      btn.removeEventListener('mouseleave', leave);
      btn.style.transform = '';
    });
    this.listeners = [];
  }
}
