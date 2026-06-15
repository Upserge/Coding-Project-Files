import { VISUAL_FEATURES, applyVisualTier } from './visual-tier';

describe('visual-tier', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('html');
  });

  it('applies shader preset attribute from feature flags', () => {
    applyVisualTier(root);
    expect(root.dataset['shaderPreset']).toBe('classic');
    expect(VISUAL_FEATURES.shaderV2).toBe(false);
  });
});
