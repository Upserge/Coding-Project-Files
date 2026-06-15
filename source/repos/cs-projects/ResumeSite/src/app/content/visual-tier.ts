/** Feature flags for upcoming V2 phases (reel, scroll). Shaders + brand ship as defaults. */

export interface VisualFeatureFlags {
  reelMotion: boolean;
  scrollNarrative: boolean;
}

export const VISUAL_FEATURES: VisualFeatureFlags = {
  reelMotion: false,
  scrollNarrative: false,
};

/** Apply feature-flag attributes for upcoming cinematic phases. */
export function applyVisualTier(root: HTMLElement = document.documentElement): VisualFeatureFlags {
  return VISUAL_FEATURES;
}
