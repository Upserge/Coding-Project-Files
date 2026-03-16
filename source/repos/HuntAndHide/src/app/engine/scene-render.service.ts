import { inject, Injectable } from '@angular/core';
import * as THREE from 'three';
import { PlayerState, HiderState, Vec3, PlayerRole } from '../models/player.model';

import { ANIMAL_COLORS, BELLY_COLORS, HUNTER_BODY_COLOR, HIDER_BODY_COLOR } from './mesh/animal-palettes';
import { buildNameSprite, applyRimLighting, updateRimLighting } from './mesh/mesh-helpers';

import { buildHunterMesh } from './mesh/hunter-mesh.builder';
import { buildHiderMesh } from './mesh/hider-mesh.builder';
import { tickWaterShaders } from './mesh/water-mesh.builder';
import { tickCaustics } from './mesh/water-caustics.builder';
import { getTerrainHeight } from './mesh/terrain-heightmap.builder';
import { updateContactShadows } from './mesh/contact-shadow.builder';
import { ProceduralAnimationService } from './animation/procedural-animation.service';
import { ParticleVfxService } from './animation/particle-vfx.service';
import { AmbientVfxService } from './animation/ambient-vfx.service';
import { FallingLeavesService } from './animation/falling-leaves.service';
import { BlinkService } from './animation/blink.service';
import { HidePromptService } from './animation/hide-prompt.service';
import { ScreenShakeService } from './animation/screen-shake.service';
import { ScoreFloaterService } from './animation/score-floater.service';
import { MapService } from '../services/map.service';
import { PlayerSurfaceEffectsService } from '../services/player-surface-effects.service';

/**
 * SceneRenderService creates and syncs Three.js meshes for players
 * each frame based on GameLoopService signals.
 *
 * Mesh building is delegated to focused builder modules under `engine/mesh/`.
 * Animation is driven by ProceduralAnimationService + ParticleVfxService.
 *
 * Call `init(scene)` once, then `syncPlayers` + `tickParticles` every frame.
 */
@Injectable({ providedIn: 'root' })
export class SceneRenderService {
  private readonly localOutlineColor = new THREE.Color(0xe9c46a);
  private readonly hunterOutlineColor = new THREE.Color(0xff4d4d);
  private readonly hiderOutlineColor = new THREE.Color(0x66bb6a);
  private readonly outlineStrength = 0.42;


  private readonly animation = inject(ProceduralAnimationService);
  private readonly particles = inject(ParticleVfxService);
  private readonly ambientVfx = inject(AmbientVfxService);
  private readonly fallingLeaves = inject(FallingLeavesService);
  private readonly blink = inject(BlinkService);
  private readonly hidePrompt = inject(HidePromptService);
  private readonly screenShake = inject(ScreenShakeService);
  private readonly scoreFloater = inject(ScoreFloaterService);
  private readonly mapService = inject(MapService);
  private readonly surfaceEffects = inject(PlayerSurfaceEffectsService);

  private scene!: THREE.Scene;

  // Mesh registries keyed by entity id
  private playerMeshes = new Map<string, THREE.Group>();
  private playerMeshRoles = new Map<string, PlayerRole>();
  private previousPositions = new Map<string, Vec3>();

  private waterElapsed = 0;
  // Boundary visual
  private boundaryGroup?: THREE.Group;
  private boundaryMaterial?: THREE.MeshBasicMaterial;
  private boundaryPulse = 0;
  private readonly boundaryBaseOpacity = 0.12;
  private readonly boundaryAmplitude = 0.08;
  // Proximity-based fade
  private boundaryProximity = 0;
  private readonly boundaryProximityThreshold = 12; // world units from edge to start fading
  private readonly boundaryMinOpacity = 0.02;
  // World-space hide prompt (set by game component each frame)
  private pendingHideSpot: Vec3 | null = null;
  // Track UIDs that already had their catch VFX spawned
  private caughtVfxSpawned = new Set<string>();

  // ── Lifecycle ──────────────────────────────────────────────

  init(scene: THREE.Scene): void {
    this.scene = scene;
    this.particles.init(scene);
    this.ambientVfx.init(scene);
    this.fallingLeaves.init(scene);
    this.hidePrompt.init(scene);
    this.scoreFloater.init(scene);
    this.createBoundary();
  }

  private createBoundary(): void {
    const map = this.mapService.getMap('jungle');
    const halfW = map.width / 2;
    const halfD = map.depth / 2;

    // Slightly larger thickness and overlap to avoid thin-edge Z-fighting / gaps
    const thickness = 1.2;
    const height = 3.0;
    const extra = 1.0; // extra overlap to cover seams at corners and sprite edges

    this.boundaryGroup = new THREE.Group();
    this.boundaryMaterial = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: this.boundaryBaseOpacity,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });

    // Four walls
    const wallGeoH = new THREE.BoxGeometry(map.width + thickness * 2 + extra, height, thickness);
    const wallGeoV = new THREE.BoxGeometry(thickness, height, map.depth + thickness * 2 + extra);

    const north = new THREE.Mesh(wallGeoH, this.boundaryMaterial);
    north.position.set(0, height / 2, -halfD - thickness / 2 - extra / 2);
    this.boundaryGroup.add(north);

    const south = new THREE.Mesh(wallGeoH, this.boundaryMaterial);
    south.position.set(0, height / 2, halfD + thickness / 2 + extra / 2);
    this.boundaryGroup.add(south);

    const west = new THREE.Mesh(wallGeoV, this.boundaryMaterial);
    west.position.set(-halfW - thickness / 2 - extra / 2, height / 2, 0);
    this.boundaryGroup.add(west);

    const east = new THREE.Mesh(wallGeoV, this.boundaryMaterial);
    east.position.set(halfW + thickness / 2 + extra / 2, height / 2, 0);
    this.boundaryGroup.add(east);

    this.boundaryGroup.traverse((c: any) => {
      c.renderOrder = 999999;
    });

    this.scene.add(this.boundaryGroup);
  }

  dispose(): void {
    this.playerMeshes.forEach(m => this.scene?.remove(m));
    if (this.boundaryGroup) {
      this.scene?.remove(this.boundaryGroup);
      this.boundaryGroup.traverse((c: any) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      this.boundaryGroup = undefined;
      this.boundaryMaterial = undefined;
    }
    this.playerMeshes.clear();
    this.playerMeshRoles.clear();
    this.previousPositions.clear();
    this.caughtVfxSpawned.clear();
    this.animation.dispose();
    this.particles.dispose();
    this.ambientVfx.dispose();
    this.fallingLeaves.dispose();
    this.scoreFloater.dispose();
    this.hidePrompt.dispose();
  }

  /** Queue the world-space hide prompt position for this frame. */
  setHideSpot(position: Vec3 | null): void {
    this.pendingHideSpot = position;
  }

  /** Spawn score floaters for hider survival bonus awards. */
  showSurvivalBonus(positions: Vec3[]): void {
    for (const pos of positions) {
      this.scoreFloater.spawn(pos, '+50', '#81c784');
    }
  }

  // ── Per-frame sync ─────────────────────────────────────────

  syncPlayers(players: PlayerState[], localUid: string, delta: number, localRole: PlayerRole): void {
    const activeIds = new Set<string>();

    for (const player of players) {
      activeIds.add(player.uid);
      const group = this.getOrCreatePlayerMesh(player);
      const prevPos = this.previousPositions.get(player.uid) ?? player.position;
      const moveDelta = this.getMovementDelta(player.position, prevPos);
      this.syncPlayerTransform(group, player);
      this.syncFacing(group, moveDelta, delta);
      this.syncOutline(group, player, localUid);
      const isCaughtHider = this.syncVisibility(group, player);
      this.syncAnimation(player, group, prevPos, delta, isCaughtHider);
      this.syncBlink(player.uid, group, delta, moveDelta);
      this.spawnCatchEffects(player, isCaughtHider);
      this.spawnFootstepEffects(player);

      this.syncHidingVisuals(group, player, localRole);

      // Save position for next frame
      this.previousPositions.set(player.uid, { ...player.position });
    }

    this.updateBoundaryProximity(players, localUid);
    this.updatePlayerContactShadows(players);
    this.removeInactiveMeshes(activeIds);
  }

  /** Advance particle effects and ambient VFX. Call once per frame. */
  tickParticles(delta: number): void {
    this.particles.tick(delta);
    this.ambientVfx.tick(delta);
    this.fallingLeaves.tick(delta);
    this.scoreFloater.tick(delta);
    this.waterElapsed += delta;
    tickWaterShaders(this.waterElapsed);
    tickCaustics(this.waterElapsed);
    // Update world-space hide prompt
    this.hidePrompt.update(this.pendingHideSpot, delta);
    this.pendingHideSpot = null;
    // Pulse + proximity-based opacity for boundary
    if (this.boundaryMaterial && this.boundaryGroup) {
      this.boundaryPulse += delta;
      const pulse = this.boundaryBaseOpacity + Math.sin(this.boundaryPulse * 2) * this.boundaryAmplitude;

      // Use proximity factor computed during syncPlayers (frame-local)
      const proxFactor = this.boundaryProximity;
      const opacity = this.boundaryMinOpacity + (pulse - this.boundaryMinOpacity) * proxFactor;
      this.boundaryMaterial.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  // ── Player mesh assembly ───────────────────────────────────

  private buildPlayerMesh(player: PlayerState): THREE.Group {
    const group = new THREE.Group();
    const color = ANIMAL_COLORS[player.animal];
    const belly = BELLY_COLORS[player.animal];
    const isHunter = player.role === 'hunter';

    this.buildCharacterMesh(group, player, color, belly, isHunter);
    this.addNameLabel(group, player, isHunter);
    this.finishPlayerMesh(group);
    return group;
  }

  private getOrCreatePlayerMesh(player: PlayerState): THREE.Group {
    const existing = this.playerMeshes.get(player.uid);
    if (existing && this.playerMeshRoles.get(player.uid) === player.role) return existing;
    if (existing) this.resetPlayerMesh(player.uid, existing);
    return this.createAndRegisterPlayerMesh(player);
  }

  private resetPlayerMesh(uid: string, group: THREE.Group): void {
    this.scene.remove(group);
    this.playerMeshes.delete(uid);
    this.playerMeshRoles.delete(uid);
    this.animation.removeContext(uid);
    this.caughtVfxSpawned.delete(uid);
  }

  private createAndRegisterPlayerMesh(player: PlayerState): THREE.Group {
    const group = this.buildPlayerMesh(player);
    this.playerMeshes.set(player.uid, group);
    this.playerMeshRoles.set(player.uid, player.role);
    this.scene.add(group);
    return group;
  }

  private getMovementDelta(position: Vec3, prevPos: Vec3): Vec3 {
    return { x: position.x - prevPos.x, y: 0, z: position.z - prevPos.z };
  }

  private syncPlayerTransform(group: THREE.Group, player: PlayerState): void {
    const terrainY = getTerrainHeight(player.position.x, player.position.z);
    group.position.set(player.position.x, player.position.y + terrainY, player.position.z);
  }

  private syncFacing(group: THREE.Group, moveDelta: Vec3, delta: number): void {
    const moveMagnitude = moveDelta.x * moveDelta.x + moveDelta.z * moveDelta.z;
    if (moveMagnitude <= 0.000001) return;
    const targetY = Math.atan2(moveDelta.x, moveDelta.z);
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetY, 0));
    const t = 1 - Math.exp(-20 * delta);
    group.quaternion.slerp(targetQuat, Math.min(1, t));
  }

  private syncVisibility(group: THREE.Group, player: PlayerState): boolean {
    const isCaughtHider = player.role === 'hider' && (player as HiderState).isCaught;
    group.visible = player.isAlive || isCaughtHider;
    return isCaughtHider;
  }

  private syncOutline(group: THREE.Group, player: PlayerState, localUid: string): void {
    updateRimLighting(group, this.getOutlineColor(player, localUid), 2.3, this.getOutlineStrength());
  }

  private getOutlineColor(player: PlayerState, localUid: string): THREE.Color {
    if (player.uid === localUid) return this.localOutlineColor;
    return player.role === 'hunter' ? this.hunterOutlineColor : this.hiderOutlineColor;
  }

  private getOutlineStrength(): number {
    return this.outlineStrength;
  }

  private syncAnimation(
    player: PlayerState,
    group: THREE.Group,
    prevPos: Vec3,
    delta: number,
    isCaughtHider: boolean,
  ): void {
    const exhausted = player.role === 'hunter' && (player as any).exhaustedFeedbackS > 0;
    this.animation.tick(player.uid, group, player.position, prevPos, delta, player.isAlive, isCaughtHider, exhausted);
  }

  private syncBlink(uid: string, group: THREE.Group, delta: number, moveDelta: Vec3): void {
    const moveLen = Math.sqrt(moveDelta.x * moveDelta.x + moveDelta.z * moveDelta.z);
    const eyeDirX = moveLen > 0.0001 ? moveDelta.x / moveLen : 0;
    const eyeDirZ = moveLen > 0.0001 ? moveDelta.z / moveLen : 0;
    this.blink.tick(uid, group, delta, eyeDirX, eyeDirZ);
  }

  private spawnCatchEffects(player: PlayerState, isCaughtHider: boolean): void {
    if (!isCaughtHider) return;
    if (this.caughtVfxSpawned.has(player.uid)) return;
    this.caughtVfxSpawned.add(player.uid);
    this.particles.spawnCatchBurst(player.position);
    this.particles.spawnConfetti(player.position);
    this.screenShake.trigger(0.3, 0.3);
    this.scoreFloater.spawn(player.position, '+100', '#e9c46a');
    this.scoreFloater.spawn(
      { x: player.position.x + 0.3, y: player.position.y, z: player.position.z + 0.3 },
      '+40% Hunger', '#66bb6a',
    );
  }

  private spawnFootstepEffects(player: PlayerState): void {
    const animCtx = this.animation.getContext(player.uid);
    if (!animCtx.footstepTriggered || !player.isAlive) return;
    this.surfaceEffects.spawnFootstep(player, animCtx.state === 'run');
  }

  private syncHidingVisuals(group: THREE.Group, player: PlayerState, localRole: PlayerRole): void {
    if (player.role !== 'hider') return;
    const hider = player as HiderState;
    if (!hider.isHiding) return this.setGroupOpacity(group, 1.0);
    if (localRole === 'hunter') return void (group.visible = false);
    this.setGroupOpacity(group, 0.35);
  }

  private setGroupOpacity(group: THREE.Group, opacity: number): void {
    group.traverse((child: any) => {
      if (!child.material || child.material.opacity === undefined) return;
      child.material.transparent = true;
      child.material.opacity = opacity;
    });
  }

  private updateBoundaryProximity(players: PlayerState[], localUid: string): void {
    const localPos = this.getLocalPosition(players, localUid);
    if (!localPos) return void (this.boundaryProximity = 0);
    const map = this.mapService.getMap('jungle');
    const distToEdgeX = map.width / 2 - Math.abs(localPos.x);
    const distToEdgeZ = map.depth / 2 - Math.abs(localPos.z);
    const nearest = Math.min(distToEdgeX, distToEdgeZ);
    const t = (this.boundaryProximityThreshold - nearest) / this.boundaryProximityThreshold;
    this.boundaryProximity = Math.max(0, Math.min(1, t));
  }

  private getLocalPosition(players: PlayerState[], localUid: string): Vec3 | null {
    const localPlayer = players.find(p => p.uid === localUid);
    return localPlayer?.position ?? this.previousPositions.get(localUid) ?? null;
  }

  private updatePlayerContactShadows(players: PlayerState[]): void {
    const shadowPositions = players
      .filter(player => player.isAlive)
      .map(player => ({ x: player.position.x, z: player.position.z }));
    updateContactShadows(shadowPositions);
  }

  private removeInactiveMeshes(activeIds: Set<string>): void {
    for (const [uid, mesh] of this.playerMeshes) {
      if (activeIds.has(uid)) continue;
      this.scene.remove(mesh);
      this.playerMeshes.delete(uid);
      this.playerMeshRoles.delete(uid);
      this.previousPositions.delete(uid);
      this.animation.removeContext(uid);
      this.caughtVfxSpawned.delete(uid);
    }
  }

  private buildCharacterMesh(
    group: THREE.Group,
    player: PlayerState,
    color: number,
    belly: number,
    isHunter: boolean,
  ): void {
    if (isHunter) return void buildHunterMesh(group, color, belly, player.animal);
    buildHiderMesh(group, color, belly, player.animal);
  }

  private addNameLabel(group: THREE.Group, player: PlayerState, isHunter: boolean): void {
    const label = buildNameSprite(player.displayName, isHunter, player.isCpu);
    label.position.set(0, 2.4, 0);
    label.renderOrder = 102;
    group.add(label);
  }

  private finishPlayerMesh(group: THREE.Group): void {
    group.castShadow = true;
    group.renderOrder = 3;
    group.layers.enable(1);
    applyRimLighting(group);
    }
}
