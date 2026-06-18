/** Feature flags for upcoming V2 phases (reel, scroll). Shaders + brand ship as defaults. */

/** Home navigation experiments — flip in VISUAL_FEATURES.navVariant. */
export type NavVariant =
  | 'legacy' /** Original full-width top link bar */
  | 'minimal' /** Option F — HUD-only home chrome (no top nav) */
  | 'sidebar'; /** Option G — studio sidebar (future) */

export interface VisualFeatureFlags {
  reelMotion: boolean;
  scrollNarrative: boolean;
  navVariant: NavVariant;
}

export const VISUAL_FEATURES: VisualFeatureFlags = {
  reelMotion: true,
  scrollNarrative: true,
  navVariant: 'minimal',
};

export function isMinimalHomeNav(variant: NavVariant = VISUAL_FEATURES.navVariant): boolean {
  return variant === 'minimal';
}

/** Apply feature-flag attributes for upcoming cinematic phases. */
export function applyVisualTier(root: HTMLElement = document.documentElement): VisualFeatureFlags {
  root.toggleAttribute('data-reel-motion', VISUAL_FEATURES.reelMotion);
  root.toggleAttribute('data-scroll-narrative', VISUAL_FEATURES.scrollNarrative);

  if (VISUAL_FEATURES.navVariant === 'legacy') {
    root.removeAttribute('data-nav-variant');
  } else {
    root.setAttribute('data-nav-variant', VISUAL_FEATURES.navVariant);
  }

  return VISUAL_FEATURES;
}
