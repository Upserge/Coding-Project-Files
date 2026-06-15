import { computeParticleFieldDensity } from './particle-field-density';

describe('computeParticleFieldDensity', () => {
  const vh = 900;

  it('uses lean budgets on a single-viewport page', () => {
    const d = computeParticleFieldDensity(vh, vh);
    expect(d.dustCount).toBeLessThanOrEqual(600);
    expect(d.galaxyCount).toBe(1);
    expect(d.includeTaurus).toBe(false);
    expect(d.goalCount).toBe(3);
  });

  it('uses full budgets on a long home-style page', () => {
    const d = computeParticleFieldDensity(vh * 6, vh);
    expect(d.dustCount).toBe(2000);
    expect(d.galaxyCount).toBe(4);
    expect(d.includeTaurus).toBe(true);
    expect(d.goalCount).toBe(6);
  });

  it('scales monotonically with page height', () => {
    const short = computeParticleFieldDensity(vh * 1.5, vh);
    const medium = computeParticleFieldDensity(vh * 3, vh);
    const tall = computeParticleFieldDensity(vh * 5, vh);
    expect(medium.dustCount).toBeGreaterThan(short.dustCount);
    expect(tall.dustCount).toBeGreaterThanOrEqual(medium.dustCount);
  });
});
