import { VisualFeatureFlags } from '../content/visual-tier';

export interface SnapTarget {
  navId: string | null;
  selector: string;
}

/** Home scroll-snap stops (desktop narrative). */
export const SCROLL_SNAP_TARGETS: SnapTarget[] = [
  { navId: null, selector: '.resume-header' },
  { navId: 'work', selector: '#work' },
  { navId: 'summary', selector: '#summary' },
  { navId: 'projects', selector: '#projects' },
  { navId: 'experience', selector: '#experience' },
  { navId: 'technologies', selector: '#technologies' },
];

export const SCROLL_SNAP_MIN_WIDTH = 1024;
export const SCROLL_SNAP_NAV_OFFSET = 52;
export const SCROLL_SNAP_NAV_SYNC_MS = 120;

export function shouldEnableScrollSnap(flags: Pick<VisualFeatureFlags, 'scrollNarrative'>): boolean {
  if (!flags.scrollNarrative) {
    return false;
  }
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  if (window.matchMedia(`(max-width: ${SCROLL_SNAP_MIN_WIDTH - 1}px)`).matches) {
    return false;
  }
  return true;
}

/** Resolve which nav section is active from current scroll position. */
export function resolveActiveNavSection(
  root: ParentNode = document,
  navOffset = SCROLL_SNAP_NAV_OFFSET,
  targets: ReadonlyArray<{ navId: string | null; element: HTMLElement }> = resolveSnapElements(root),
): string | null {
  let bestId: string | null = null;
  let bestDistance = Infinity;

  for (const target of targets) {
    const rect = target.element.getBoundingClientRect();
    if (rect.bottom <= navOffset || rect.top >= window.innerHeight) {
      continue;
    }

    const distance = Math.abs(rect.top - navOffset);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = target.navId;
    }
  }

  return bestId;
}

export function resolveSnapElements(root: ParentNode = document): Array<{ navId: string | null; element: HTMLElement }> {
  const resolved: Array<{ navId: string | null; element: HTMLElement }> = [];
  for (const target of SCROLL_SNAP_TARGETS) {
    const el = root.querySelector<HTMLElement>(target.selector);
    if (el) {
      resolved.push({ navId: target.navId, element: el });
    }
  }
  return resolved;
}

/** Desktop home scroll-snap — CSS-native snap + nav section sync. */
export class ScrollSnapHome {
  private enabled = false;
  private scrollHandler: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private motionHandler: (() => void) | null = null;
  private scrollRaf: number | null = null;
  private navSyncTimer: ReturnType<typeof setTimeout> | null = null;
  private lastNavSection: string | null | undefined;
  private snapTargets: Array<{ navId: string | null; element: HTMLElement }> = [];
  private readonly desktopQuery =
    typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${SCROLL_SNAP_MIN_WIDTH}px)`) : null;
  private readonly motionQuery =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  constructor(
    private readonly flags: Pick<VisualFeatureFlags, 'scrollNarrative'>,
    private readonly onSectionChange: (sectionId: string | null) => void,
  ) {}

  init(): void {
    this.resizeHandler = () => {
      this.refreshSnapTargets();
      this.syncEnabledState();
    };
    this.motionHandler = () => this.syncEnabledState();
    window.addEventListener('resize', this.resizeHandler);
    this.desktopQuery?.addEventListener('change', this.resizeHandler);
    this.motionQuery?.addEventListener('change', this.motionHandler);
    this.syncEnabledState();
  }

  destroy(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.desktopQuery?.removeEventListener('change', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.motionHandler) {
      this.motionQuery?.removeEventListener('change', this.motionHandler);
      this.motionHandler = null;
    }
    if (this.scrollRaf !== null) {
      cancelAnimationFrame(this.scrollRaf);
      this.scrollRaf = null;
    }
    if (this.navSyncTimer !== null) {
      clearTimeout(this.navSyncTimer);
      this.navSyncTimer = null;
    }
    this.disable();
  }

  private refreshSnapTargets(): void {
    this.snapTargets = resolveSnapElements();
  }

  private syncEnabledState(): void {
    if (shouldEnableScrollSnap(this.flags)) {
      this.enable();
    } else {
      this.disable();
    }
  }

  private enable(): void {
    if (this.enabled) {
      this.refreshSnapTargets();
      this.syncNavSection();
      return;
    }

    this.enabled = true;
    this.refreshSnapTargets();
    document.documentElement.classList.add('scroll-snap-enabled');
    document.documentElement.setAttribute('data-scroll-snap', 'on');

    this.scrollHandler = () => {
      if (this.scrollRaf !== null) return;
      this.scrollRaf = requestAnimationFrame(() => {
        this.scrollRaf = null;
        this.scheduleNavSync();
      });
    };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    this.syncNavSection();
  }

  private disable(): void {
    if (!this.enabled) return;

    this.enabled = false;
    document.documentElement.classList.remove('scroll-snap-enabled');
    document.documentElement.removeAttribute('data-scroll-snap');

    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    if (this.scrollRaf !== null) {
      cancelAnimationFrame(this.scrollRaf);
      this.scrollRaf = null;
    }
    if (this.navSyncTimer !== null) {
      clearTimeout(this.navSyncTimer);
      this.navSyncTimer = null;
    }
    this.lastNavSection = undefined;
    this.snapTargets = [];
  }

  private scheduleNavSync(): void {
    if (this.navSyncTimer !== null) {
      clearTimeout(this.navSyncTimer);
    }
    this.navSyncTimer = setTimeout(() => {
      this.navSyncTimer = null;
      this.syncNavSection();
    }, SCROLL_SNAP_NAV_SYNC_MS);
  }

  private syncNavSection(): void {
    const sectionId = resolveActiveNavSection(document, SCROLL_SNAP_NAV_OFFSET, this.snapTargets);
    if (sectionId === this.lastNavSection) return;
    this.lastNavSection = sectionId;
    this.onSectionChange(sectionId);
  }
}
