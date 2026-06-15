/** Tunable background budgets derived from document height. */
export interface ParticleFieldDensity {
  dustCount: number;
  galaxyCount: number;
  goalCount: number;
  goldenCount: number;
  confettiCount: number;
  maxTrailCount: number;
  includeTaurus: boolean;
}

const DUST_MIN = 500;
const DUST_MAX = 2000;
const GALAXY_MIN = 1;
const GALAXY_MAX = 4;
const GOAL_MIN = 3;
const GOAL_MAX = 6;
const GOLDEN_SHORT = 2;
const GOLDEN_FULL = 3;

/** Full richness at ~5+ viewport heights; lean budgets on short subpages. */
export function computeParticleFieldDensity(
  pageHeight: number,
  viewportHeight: number,
): ParticleFieldDensity {
  const vh = Math.max(viewportHeight, 320);
  const viewports = pageHeight / vh;

  const t = Math.min(1, Math.max(0, (viewports - 1.25) / 3.75));
  const ease = t * t * (3 - 2 * t);

  return {
    dustCount: Math.round(DUST_MIN + (DUST_MAX - DUST_MIN) * ease),
    galaxyCount: Math.round(GALAXY_MIN + (GALAXY_MAX - GALAXY_MIN) * ease),
    goalCount: Math.round(GOAL_MIN + (GOAL_MAX - GOAL_MIN) * ease),
    goldenCount: viewports < 2 ? GOLDEN_SHORT : GOLDEN_FULL,
    confettiCount: Math.round(20 + 40 * ease),
    maxTrailCount: Math.round(60 + 140 * ease),
    includeTaurus: viewports >= 2,
  };
}
