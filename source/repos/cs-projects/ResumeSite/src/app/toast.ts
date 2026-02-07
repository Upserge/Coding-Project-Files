// Toast notification system for copy feedback
export class Toast {
  static show(message: string, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) reverse';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
}
