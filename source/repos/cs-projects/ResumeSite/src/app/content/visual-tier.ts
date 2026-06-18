/** Feature flags for upcoming V2 phases (reel, scroll). Shaders + brand ship as defaults. */

export interface VisualFeatureFlags {
  reelMotion: boolean;
  scrollNarrative: boolean;
}

export const VISUAL_FEATURES: VisualFeatureFlags = {
  reelMotion: true,
  scrollNarrative: true,
};

/** Apply feature-flag attributes for upcoming cinematic phases. */
export function applyVisualTier(root: HTMLElement = document.documentElement): VisualFeatureFlags {
  root.toggleAttribute('data-reel-motion', VISUAL_FEATURES.reelMotion);
  root.toggleAttribute('data-scroll-narrative', VISUAL_FEATURES.scrollNarrative);
  return VISUAL_FEATURES;
}
