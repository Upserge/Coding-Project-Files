// Toast notification system — copy feedback + narrative story beats

export type ToastVariant = 'default' | 'narrative';

export interface ToastOptions {
  readonly variant?: ToastVariant;
  readonly duration?: number;
}

const NARRATIVE_Z = 10050;
const DEFAULT_Z = 10050;

export class Toast {
  static show(message: string, durationOrOptions?: number | ToastOptions, legacyDuration?: number) {
    let duration = 2000;
    let variant: ToastVariant = 'default';

    if (typeof durationOrOptions === 'number') {
      duration = durationOrOptions;
    } else if (durationOrOptions) {
      duration = durationOrOptions.duration ?? 2000;
      variant = durationOrOptions.variant ?? 'default';
    }
    if (legacyDuration !== undefined) {
      duration = legacyDuration;
    }

    const toast = document.createElement('div');
    toast.className = variant === 'narrative' ? 'toast toast-narrative' : 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    toast.style.zIndex = String(variant === 'narrative' ? NARRATIVE_Z : DEFAULT_Z);
    document.body.appendChild(toast);

    // Force reflow so entrance animation runs reliably after DOM insert
    toast.getBoundingClientRect();

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 420);
    }, duration);
  }
}
