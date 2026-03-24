import { inject, Injectable } from '@angular/core';
import { PlayerState, Vec3 } from '../models/player.model';
import { isPositionInWater } from '../models/water-feature.model';
import { ParticleVfxService } from '../engine/animation/particle-vfx.service';
import { FootprintVfxService } from '../engine/animation/footprint-vfx.service';
import { MapService } from './map.service';

interface StepCadence {
  nextSide: 'left' | 'right';
  cooldownS: number;
}

interface StepTuning {
  life: number;
  scale: number;
  opacity: number;
  lateralOffset: number;
  cooldownS: number;
}

const WALK_STEP: StepTuning = {
  life: 6.0,
  scale: 0.82,
  opacity: 0.34,
  lateralOffset: 0.16,
  cooldownS: 0.22,
};

const RUN_STEP: StepTuning = {
  life: 4.2,
  scale: 0.92,
  opacity: 0.42,
  lateralOffset: 0.21,
  cooldownS: 0.12,
};

const FOOTPRINT_YAW_JITTER = 0.08;
const FOOTPRINT_SCALE_JITTER = 0.08;

@Injectable({ providedIn: 'root' })
export class PlayerSurfaceEffectsService {
  private readonly particles = inject(ParticleVfxService);
  private readonly footprints = inject(FootprintVfxService);
  private readonly mapService = inject(MapService);
  private cadenceByPlayer = new Map<string, StepCadence>();

  spawnFootstep(player: PlayerState, isRunning: boolean, moveDelta: Vec3): void {
    const cadence = this.getOrCreateCadence(player.uid);
    if (!this.consumeCooldown(cadence, isRunning)) return;
    if (this.isInWater(player)) return this.particles.spawnWaterFootstep(player.position, isRunning);
    this.spawnFootprint(player, cadence, isRunning, moveDelta);
    this.particles.spawnFootstep(player.position, isRunning);
  }

  tick(delta: number): void {
    this.tickCadenceCooldowns(delta);
  }

  removePlayer(uid: string): void {
    this.cadenceByPlayer.delete(uid);
  }

  reset(): void {
    this.cadenceByPlayer.clear();
  }

  private isInWater(player: PlayerState): boolean {
    return isPositionInWater(player.position, this.mapService.getMap('jungle').waterFeatures);
  }

  private getOrCreateCadence(uid: string): StepCadence {
    const existing = this.cadenceByPlayer.get(uid);
    if (existing) return existing;
    const created: StepCadence = { nextSide: 'left', cooldownS: 0 };
    this.cadenceByPlayer.set(uid, created);
    return created;
  }

  private consumeCooldown(cadence: StepCadence, isRunning: boolean): boolean {
    if (cadence.cooldownS > 0) return false;
    cadence.cooldownS = this.getStepTuning(isRunning).cooldownS;
    return true;
  }

  private tickCadenceCooldowns(delta: number): void {
    for (const cadence of this.cadenceByPlayer.values()) cadence.cooldownS = Math.max(0, cadence.cooldownS - delta);
  }

  private spawnFootprint(player: PlayerState, cadence: StepCadence, isRunning: boolean, moveDelta: Vec3): void {
    const tuning = this.getStepTuning(isRunning);
    const yaw = this.getYaw(player, moveDelta);
    const side = cadence.nextSide === 'left' ? -1 : 1;
    const x = player.position.x + Math.cos(yaw) * tuning.lateralOffset * side;
    const z = player.position.z - Math.sin(yaw) * tuning.lateralOffset * side;
    cadence.nextSide = cadence.nextSide === 'left' ? 'right' : 'left';
    this.footprints.spawn({
      x,
      z,
      yaw: yaw + this.randomJitter(FOOTPRINT_YAW_JITTER),
      life: tuning.life,
      scale: tuning.scale * (1 + this.randomJitter(FOOTPRINT_SCALE_JITTER)),
      opacity: tuning.opacity,
    });
  }

  private getStepTuning(isRunning: boolean): StepTuning {
    return isRunning ? RUN_STEP : WALK_STEP;
  }

  private getYaw(player: PlayerState, moveDelta: Vec3): number {
    const moveLenSq = moveDelta.x * moveDelta.x + moveDelta.z * moveDelta.z;
    if (moveLenSq > 0.000001) return Math.atan2(moveDelta.x, moveDelta.z);
    return player.rotation.y ?? 0;
  }

  private randomJitter(amount: number): number {
    return (Math.random() - 0.5) * 2 * amount;
  }
}
