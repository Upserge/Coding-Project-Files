import { VISUAL_FEATURES, applyVisualTier, isMinimalHomeNav } from './visual-tier';

describe('visual-tier', () => {
  it('returns feature flags from applyVisualTier', () => {
    const config = applyVisualTier(document.documentElement);
    expect(config).toBe(VISUAL_FEATURES);
    expect(config.reelMotion).toBe(true);
    expect(config.scrollNarrative).toBe(true);
    expect(config.navVariant).toBe('minimal');
    expect(document.documentElement.getAttribute('data-nav-variant')).toBe('minimal');
  });

  it('detects minimal home nav variant', () => {
    expect(isMinimalHomeNav('minimal')).toBeTrue();
    expect(isMinimalHomeNav('legacy')).toBeFalse();
  });
});
