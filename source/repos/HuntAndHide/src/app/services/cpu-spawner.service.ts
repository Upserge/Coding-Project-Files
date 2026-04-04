import { inject, Injectable } from '@angular/core';
import { HiderState, HunterState, Vec3, HIDER_ANIMALS, HUNTER_ANIMALS } from '../models/player.model';
import { PlayerService } from './player.service';
import { CpuBrainService } from './cpu-brain.service';
import { MapService } from './map.service';

/** Maximum lobby size. */
const MAX_PLAYERS = 10;

/** Once this many real players join, CPU slots stop being filled. */
const REAL_PLAYER_THRESHOLD = 5;

/** CPU display-name pool. */
const CPU_NAMES: readonly string[] = [
  'BotAlpha', 'BotBravo', 'BotCharlie', 'BotDelta',
  'BotEcho', 'BotFoxtrot', 'BotGolf', 'BotHotel',
  'BotIndia', 'BotJuliet',
];

let nextCpuId = 0;

/**
 * CpuSpawnerService manages the lifecycle of CPU-controlled players.
 * It fills empty lobby slots (up to MAX_PLAYERS) with bots until
 * REAL_PLAYER_THRESHOLD real players are present.
 */
@Injectable({ providedIn: 'root' })
export class CpuSpawnerService {
  private readonly playerService = inject(PlayerService);
  private readonly brain = inject(CpuBrainService);
  private readonly mapService = inject(MapService);

  // ── Public API ─────────────────────────────────────────────

  /**
   * Reconcile CPU roster so that total = MAX_PLAYERS when
   * fewer than REAL_PLAYER_THRESHOLD real players are present.
   * Returns the updated hider / hunter arrays.
   */
  reconcile(
    hiders: HiderState[],
    hunters: HunterState[],
  ): { hiders: HiderState[]; hunters: HunterState[] } {
    const realCount = this.countReal(hiders) + this.countReal(hunters);
    const cpuCount = this.countCpu(hiders) + this.countCpu(hunters);
    const totalCount = realCount + cpuCount;

    // Enough real players — remove all CPUs
    if (realCount >= REAL_PLAYER_THRESHOLD) {
      return this.removeAllCpus(hiders, hunters);
    }

    const desired = MAX_PLAYERS - realCount;
    const diff = desired - cpuCount;

    // Need more CPUs
    if (diff > 0) {
      return this.spawnCpus(hiders, hunters, diff);
    }

    // Too many CPUs (a real player joined)
    if (diff < 0) {
      return this.removeCpus(hiders, hunters, Math.abs(diff));
    }

    return { hiders, hunters };
  }

  /** Clean up all brain state. */
  dispose(): void {
    this.brain.clear();
  }

  // ── Spawn helpers ──────────────────────────────────────────

  private spawnCpus(
    hiders: HiderState[],
    hunters: HunterState[],
    count: number,
  ): { hiders: HiderState[]; hunters: HunterState[] } {
    const newHiders = [...hiders];
    const newHunters = [...hunters];
    const takenAnimals = [...hiders, ...hunters].map(p => p.animal);

    for (let i = 0; i < count; i++) {
      const hiderCount = newHiders.length;
      const hunterCount = newHunters.length;
      const role = this.playerService.assignRole(hiderCount, hunterCount);
      const animal = this.playerService.assignAnimal(role, takenAnimals);
      takenAnimals.push(animal);

      const spawn = this.randomSpawn(role);
      const uid = `cpu_${nextCpuId++}`;
      const name = CPU_NAMES[i % CPU_NAMES.length];

      if (role === 'hider') {
        const bot = this.buildCpuHider(uid, name, animal as any, spawn);
        newHiders.push(bot);
      } else {
        const bot = this.buildCpuHunter(uid, name, animal as any, spawn);
        newHunters.push(bot);
      }

      this.brain.register(uid);
    }

    return { hiders: newHiders, hunters: newHunters };
  }

  private removeCpus(
    hiders: HiderState[],
    hunters: HunterState[],
    count: number,
  ): { hiders: HiderState[]; hunters: HunterState[] } {
    let remaining = count;

    const prunedHunters = hunters.filter(h => {
      if (remaining <= 0) return true;
      if (!h.isCpu) return true;
      this.brain.unregister(h.uid);
      remaining--;
      return false;
    });

    const prunedHiders = hiders.filter(h => {
      if (remaining <= 0) return true;
      if (!h.isCpu) return true;
      this.brain.unregister(h.uid);
      remaining--;
      return false;
    });

    return { hiders: prunedHiders, hunters: prunedHunters };
  }

  private removeAllCpus(
    hiders: HiderState[],
    hunters: HunterState[],
  ): { hiders: HiderState[]; hunters: HunterState[] } {
    hiders.filter(h => h.isCpu).forEach(h => this.brain.unregister(h.uid));
    hunters.filter(h => h.isCpu).forEach(h => this.brain.unregister(h.uid));

    return {
      hiders: hiders.filter(h => !h.isCpu),
      hunters: hunters.filter(h => !h.isCpu),
    };
  }

  // ── Factory helpers ────────────────────────────────────────

  private buildCpuHider(uid: string, name: string, animal: any, spawn: Vec3): HiderState {
    return {
      uid,
      displayName: name,
      role: 'hider',
      animal,
      position: { ...spawn },
      rotation: { x: 0, y: 0, z: 0 },
      isAlive: true,
      score: 50,
      isCpu: true,
      idleTimerMs: 0,
      isHiding: false,
      hidingSpotId: null,
      isCaught: false,
      isDashing: false,
      dashTimeS: 0,
      dashCooldownS: 0,
    };
  }

  private buildCpuHunter(uid: string, name: string, animal: any, spawn: Vec3): HunterState {
    return {
      uid,
      displayName: name,
      role: 'hunter',
      animal,
      position: { ...spawn },
      rotation: { x: 0, y: 0, z: 0 },
      isAlive: true,
      score: 0,
      isCpu: true,
      hungerRemainingMs: 300_000,
      stamina: 100,
      isSprinting: false,
      exhaustedFeedbackS: 0,
      exhaustionCooldownS: 0,
      kills: 0,
      isPouncing: false,
      pounceTimeS: 0,
      pounceCooldownS: 0,
    };
  }

  private randomSpawn(role: 'hider' | 'hunter'): Vec3 {
    const map = this.mapService.generateJungleMap();
    const spawns = map.spawnPoints.filter(s => s.forRole === role);
    const pick = spawns[Math.floor(Math.random() * spawns.length)];
    return pick?.position ?? { x: 0, y: 0, z: 0 };
  }

  // ── Counting helpers ───────────────────────────────────────

  private countReal(players: { isCpu: boolean }[]): number {
    return players.filter(p => !p.isCpu).length;
  }

  private countCpu(players: { isCpu: boolean }[]): number {
    return players.filter(p => p.isCpu).length;
  }
}
