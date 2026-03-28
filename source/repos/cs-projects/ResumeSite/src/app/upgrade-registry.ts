// Upgrade definitions and random selection logic

export type UpgradeCategory = 'mobility' | 'control' | 'scoring' | 'chaos' | 'survival';
export type UpgradeRarity = 'common' | 'uncommon' | 'rare' | 'ultra-rare';

export interface Upgrade {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: UpgradeCategory;
  readonly rarity: UpgradeRarity;
  readonly maxStacks: number;
}

export const RARITY_COLORS: Record<UpgradeRarity, string> = {
  'common': '#4ade80',
  'uncommon': '#60a5fa',
  'rare': '#c084fc',
  'ultra-rare': '#fbbf24',
};

export const RARITY_LABELS: Record<UpgradeRarity, string> = {
  'common': 'Common',
  'uncommon': 'Uncommon',
  'rare': 'Rare',
  'ultra-rare': 'Ultra Rare',
};

const RARITY_WEIGHTS: Record<UpgradeRarity, number> = {
  'common': 50,
  'uncommon': 30,
  'rare': 15,
  'ultra-rare': 5,
};

export const UPGRADE_POOL: readonly Upgrade[] = [
  {
    id: 'bigger-push',
    name: 'Wider Push Field',
    description: 'Mouse influence radius increases by 20%.',
    category: 'mobility',
    rarity: 'common',
    maxStacks: 3,
  },
  {
    id: 'stronger-thrusters',
    name: 'Stronger Thrusters',
    description: 'Rockets accelerate 25% faster when pushed.',
    category: 'mobility',
    rarity: 'common',
    maxStacks: 3,
  },
  {
    id: 'momentum-lock',
    name: 'Momentum Lock',
    description: 'Rockets keep velocity longer (less drag).',
    category: 'control',
    rarity: 'uncommon',
    maxStacks: 2,
  },
  {
    id: 'tractor-aim',
    name: 'Tractor Aim',
    description: 'Pushed rockets gently steer toward the nearest black hole.',
    category: 'control',
    rarity: 'rare',
    maxStacks: 2,
  },
  {
    id: 'wider-horizon',
    name: 'Wider Event Horizon',
    description: 'Black holes grow 15% larger, easier to hit.',
    category: 'scoring',
    rarity: 'common',
    maxStacks: 3,
  },
  {
    id: 'gravity-well',
    name: 'Gravity Well',
    description: 'Black holes gently pull nearby rockets inward.',
    category: 'scoring',
    rarity: 'uncommon',
    maxStacks: 2,
  },
  {
    id: 'double-collapse',
    name: 'Double Collapse',
    description: '20% chance a scored black hole counts as +2.',
    category: 'scoring',
    rarity: 'rare',
    maxStacks: 3,
  },
  {
    id: 'multi-rocket',
    name: 'Multi-Rocket',
    description: 'Spawn one extra rocket ship.',
    category: 'chaos',
    rarity: 'uncommon',
    maxStacks: 2,
  },
  {
    id: 'chain-reaction',
    name: 'Chain Reaction',
    description: 'Scoring briefly enlarges nearby black holes.',
    category: 'chaos',
    rarity: 'rare',
    maxStacks: 2,
  },
  {
    id: 'dark-matter-rush',
    name: 'Dark Matter Rush',
    description: 'Two extra black holes spawn on the field.',
    category: 'chaos',
    rarity: 'ultra-rare',
    maxStacks: 2,
  },
  {
    id: 'entropy-shield',
    name: 'Entropy Shield',
    description: 'Entropy corruption rate reduced by 15%.',
    category: 'survival',
    rarity: 'common',
    maxStacks: 3,
  },
  {
    id: 'emergency-vent',
    name: 'Emergency Vent',
    description: '25% chance to freeze entropy for 3s on goal.',
    category: 'survival',
    rarity: 'uncommon',
    maxStacks: 2,
  },
  {
    id: 'temporal-anchor',
    name: 'Temporal Anchor',
    description: 'Future wave events last 30% shorter.',
    category: 'survival',
    rarity: 'rare',
    maxStacks: 2,
  },
  {
    id: 'phoenix-protocol',
    name: 'Phoenix Protocol',
    description: 'Destroyed rockets respawn instantly.',
    category: 'survival',
    rarity: 'ultra-rare',
    maxStacks: 1,
  },
  {
    id: 'singularity-pulse',
    name: 'Singularity Pulse',
    description: 'Every 5th goal triggers a hazard-clearing shockwave.',
    category: 'survival',
    rarity: 'rare',
    maxStacks: 1,
  },
] as const;

const CATEGORY_ICONS: Record<UpgradeCategory, string> = {
  mobility: '🚀',
  control: '🎯',
  scoring: '⭐',
  chaos: '🌀',
  survival: '🛡️',
};

export function getCategoryIcon(category: UpgradeCategory): string {
  return CATEGORY_ICONS[category];
}

export function pickRandomUpgrades(
  currentStacks: ReadonlyMap<string, number>,
  count: number,
): Upgrade[] {
  const available = UPGRADE_POOL.filter(u => {
    const stacks = currentStacks.get(u.id) ?? 0;
    return stacks < u.maxStacks;
  });

  return weightedPick(available, count);
}

function weightedPick(items: readonly Upgrade[], count: number): Upgrade[] {
  const pool = [...items];
  const result: Upgrade[] = [];

  for (let n = 0; n < count; n++) {
    if (pool.length === 0) break;

    const totalWeight = pool.reduce((sum, u) => sum + RARITY_WEIGHTS[u.rarity], 0);
    let roll = Math.random() * totalWeight;

    let picked = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= RARITY_WEIGHTS[pool[i].rarity];
      if (roll <= 0) { picked = i; break; }
    }

    result.push(pool[picked]);
    pool.splice(picked, 1);
  }

  return result;
}
