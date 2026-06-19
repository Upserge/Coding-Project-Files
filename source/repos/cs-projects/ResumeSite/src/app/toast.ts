// Toast notification system — unified glass surfaces (action + narrative variants)

export type ToastVariant = 'action' | 'narrative';

/** @deprecated Use `action` — kept for callers still passing `default`. */
export type ToastVariantLegacy = ToastVariant | 'default';

export interface ToastOptions {
  readonly variant?: ToastVariantLegacy;
  readonly duration?: number;
}

const Z_INDEX = 10050;

export class Toast {
  static show(message: string, durationOrOptions?: number | ToastOptions, legacyDuration?: number) {
    let duration = 2000;
    let variant: ToastVariant = 'action';

    if (typeof durationOrOptions === 'number') {
      duration = durationOrOptions;
    } else if (durationOrOptions) {
      duration = durationOrOptions.duration ?? 2000;
      const raw = durationOrOptions.variant ?? 'action';
      variant = raw === 'default' ? 'action' : raw;
    }
    if (legacyDuration !== undefined) {
      duration = legacyDuration;
    }

    const toast = document.createElement('div');
    toast.className =
      variant === 'narrative' ? 'toast toast--narrative' : 'toast toast--action';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    toast.style.zIndex = String(Z_INDEX);
    document.body.appendChild(toast);

    toast.getBoundingClientRect();

    setTimeout(() => {
      toast.classList.add('toast--exit');
      setTimeout(() => toast.remove(), 420);
    }, duration);
  }
}
