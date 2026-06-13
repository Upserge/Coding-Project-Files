/**
 * Session-score pacing — tuned so story beats land in ~3–5 minutes of casual play
 * (~1 point per goal, occasional doubles from upgrades).
 */
export const SESSION_MILESTONES = [1, 3, 5, 8, 12] as const;
export const STORY_SCORE_COMPLETE = SESSION_MILESTONES[SESSION_MILESTONES.length - 1];
export const POST_STORY_MILESTONE_INTERVAL = 8;

export const GAME_STORY_COPY = {
  thesis: 'Move the canvas to see how I think about systems under pressure.',
  howToTitle: 'What am I playing?',
  bullets: [
    'Golden rockets drift behind the résumé — your cursor pushes them like a force field.',
    'Guide rockets into black holes to score. Each goal unlocks upgrades and story beats.',
    `During the story, the pressure timer cannot end your run. After score ${STORY_SCORE_COMPLETE}, challenge mode kicks in.`,
  ],
  tutorialSteps: [
    {
      title: 'Find the rockets',
      body: 'Look for golden particles drifting across the page. They respond to your cursor.',
    },
    {
      title: 'Push toward black holes',
      body: 'Move your mouse near a rocket to repel it, then aim it into a pulsing black hole.',
    },
    {
      title: 'Score to unlock the story',
      body: `Each goal adds points and narrative context. The run stays forgiving until you hit ${STORY_SCORE_COMPLETE}.`,
    },
  ],
} as const;

export interface NarrativeToast {
  readonly minScore: number;
  readonly storageKey: string;
  readonly message: string;
  readonly duration?: number;
}

export const NARRATIVE_TOASTS: readonly NarrativeToast[] = [
  {
    minScore: 3,
    storageKey: 'narrative-toast-3',
    message: 'Focus mode fades the résumé as you play — balancing spectacle vs clarity, same tradeoff I ship with.',
    duration: 5200,
  },
  {
    minScore: 6,
    storageKey: 'narrative-toast-6',
    message: 'Entropy and combos mirror systems thinking: pressure rises, but good plays knock it back.',
    duration: 5200,
  },
  {
    minScore: STORY_SCORE_COMPLETE,
    storageKey: 'narrative-toast-12',
    message: 'Story complete — challenge mode unlocked. The timer can end your run now. Explore the Resume Site case study when you are ready.',
    duration: 6500,
  },
];

export const UPGRADE_FLAVOR: Readonly<Record<string, string>> = {
  'bigger-push': 'Wider influence — like scaling QA coverage across more surface area.',
  'stronger-thrusters': 'More acceleration when you commit — momentum matters at ship cadence.',
  'momentum-lock': 'Systems that hold velocity beat ones that constantly reset state.',
  'tractor-aim': 'Gentle guidance toward the goal — automation that assists without replacing judgment.',
  'wider-horizon': 'Larger capture radius — fewer near-miss regressions slipping through.',
  'gravity-well': 'Pull toward the riskiest targets before they become player-facing incidents.',
  'double-collapse': 'Two signals from one action — duplicate detection at scale.',
  'multi-rocket': 'Parallel workstreams when the problem space demands it.',
  'dark-matter-rush': 'More black holes, more coverage — Premier across 20 regions.',
  'chain-reaction': 'One fix triggers the next — cascade validation when systems interconnect.',
  'entropy-shield': 'Slow the pressure clock — buying time to investigate before escalation.',
  'emergency-vent': 'Freeze entropy briefly — the incident bridge while you patch live.',
  'phoenix-protocol': 'Recover from a bad state — resilience after a failed deploy.',
  'singularity-pulse': 'Rhythmic pulses of risk — live-service cadence never sleeps.',
};

export function getUpgradeFlavor(upgradeId: string): string | undefined {
  return UPGRADE_FLAVOR[upgradeId];
}
