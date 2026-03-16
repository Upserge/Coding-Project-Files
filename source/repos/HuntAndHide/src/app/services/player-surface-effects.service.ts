import { inject, Injectable } from '@angular/core';
import { PlayerState } from '../models/player.model';
import { isPositionInWater } from '../models/water-feature.model';
import { ParticleVfxService } from '../engine/animation/particle-vfx.service';
import { MapService } from './map.service';

@Injectable({ providedIn: 'root' })
export class PlayerSurfaceEffectsService {
  private readonly particles = inject(ParticleVfxService);
  private readonly mapService = inject(MapService);

  spawnFootstep(player: PlayerState, isRunning: boolean): void {
    if (this.isInWater(player)) return this.particles.spawnWaterFootstep(player.position, isRunning);
    this.particles.spawnFootstep(player.position, isRunning);
  }

  private isInWater(player: PlayerState): boolean {
    return isPositionInWater(player.position, this.mapService.getMap('jungle').waterFeatures);
  }
}
