/** Feature flags for upcoming V2 phases (shader, reel, scroll). Brand is always on. */

export type ShaderPreset = 'classic' | 'aurora' | 'studio';

export interface VisualFeatureFlags {
  shaderV2: boolean;
  shaderPreset: ShaderPreset;
  reelMotion: boolean;
  scrollNarrative: boolean;
}

export const VISUAL_FEATURES: VisualFeatureFlags = {
  shaderV2: false,
  shaderPreset: 'classic',
  reelMotion: false,
  scrollNarrative: false,
};

/** Apply feature-flag attributes for upcoming cinematic phases. */
export function applyVisualTier(root: HTMLElement = document.documentElement): VisualFeatureFlags {
  const config = VISUAL_FEATURES;
  root.dataset['shaderPreset'] = config.shaderV2 ? config.shaderPreset : 'classic';
  return config;
}
