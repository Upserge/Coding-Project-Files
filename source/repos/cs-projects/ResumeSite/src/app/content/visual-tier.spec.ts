import { VISUAL_FEATURES, applyVisualTier } from './visual-tier';

describe('visual-tier', () => {
  it('returns feature flags from applyVisualTier', () => {
    const config = applyVisualTier(document.documentElement);
    expect(config).toBe(VISUAL_FEATURES);
    expect(config.reelMotion).toBe(true);
    expect(config.scrollNarrative).toBe(false);
  });
});
