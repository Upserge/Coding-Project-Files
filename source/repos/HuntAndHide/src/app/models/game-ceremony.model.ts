import { PlayerRole } from './player.model';

export type CeremonyTone = 'neutral' | 'hunter' | 'hider' | 'local';

export interface CeremonyStep {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  tone: CeremonyTone;
  durationMs: number;
}

const ROLE_REVEAL_DURATION_MS = 3200;

const ROLE_REVEAL_CONFIG: Record<PlayerRole, Omit<CeremonyStep, 'id' | 'durationMs'>> = {
  hunter: {
    title: 'You Are The Hunter',
    subtitle: 'Track the hiders down before hunger takes you.',
    badge: '🐺',
    tone: 'hunter',
  },
  hider: {
    title: 'You Are A Hider',
    subtitle: 'Blend in, stay moving, and survive the round.',
    badge: '🌿',
    tone: 'hider',
  },
};

export function buildBeginningGameCeremony(role: PlayerRole): CeremonyStep[] {
  return [{
    id: 'role-reveal',
    durationMs: ROLE_REVEAL_DURATION_MS,
    ...ROLE_REVEAL_CONFIG[role],
  }];
}
