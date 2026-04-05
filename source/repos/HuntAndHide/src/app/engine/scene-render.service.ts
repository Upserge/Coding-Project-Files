import { inject, Injectable } from '@angular/core';
import * as THREE from 'three';
import {
  PlayerState,
  HiderState,
  HunterState,
  Vec3,
  PlayerRole,
  HIDER_DASH_DURATION_S,
  HUNTER_POUNCE_DURATION_S,
} from '../models/player.model';

import { ANIMAL_COLORS, BELLY_COLORS, HUNTER_BODY_COLOR, HIDER_BODY_COLOR } from './mesh/animal-palettes';
import { buildNameSprite, applyRimLighting, updateRimLighting } from './mesh/mesh-helpers';

import { buildHunterMesh } from './mesh/hunter-mesh.builder';
import { buildHiderMesh } from './mesh/hider-mesh.builder';
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
import { FootprintVfxService } from './animation/footprint-vfx.service';
import { HideRuffleService } from './animation/hide-ruffle.service';
import { MvpCrownService } from './animation/mvp-crown.service';
import { MapService } from '../services/map.service';
import { PlayerSurfaceEffectsService } from '../services/player-surface-effects.service';
import { BoundaryRenderService } from './boundary-render.service';

const POUNCE_GROUND_WEDGE_NAME = 'pounce-ground-wedge';
const DASH_GROUND_LOOP_NAME = 'dash-ground-loop';
const AFTERIMAGE_PREFIX = 'afterimage-';
const AFTERIMAGE_LIFE_S = 0.5;
const AFTERIMAGE_MAX_PER_PLAYER = 20;

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
  private readonly footprints = inject(FootprintVfxService);
  private readonly hideRuffle = inject(HideRuffleService);
  private readonly mvpCrown = inject(MvpCrownService);
  private readonly mapService = inject(MapService);
  private readonly surfaceEffects = inject(PlayerSurfaceEffectsService);
  private readonly boundary = inject(BoundaryRenderService);

  private scene!: THREE.Scene;

  // Mesh registries keyed by entity id
  private playerMeshes = new Map<string, THREE.Group>();
  private playerMeshRoles = new Map<string, PlayerRole>();
  private previousPositions = new Map<string, Vec3>();
  private afterimages = new Set<THREE.Group>();
  private afterimageSlotBySource = new Map<string, number>();

  // World-space hide prompt (set by game component each frame)
  private pendingHideSpot: Vec3 | null = null;
  // Track UIDs that already had their catch VFX spawned
  private caughtVfxSpawned = new Set<string>();
  // Track UIDs currently hiding (to detect enter-hide transitions)
  private hidingUids = new Set<string>();
  // World-space pounce impact rings (independent of wedge lifecycle)
  private impactRings = new Set<THREE.Mesh>();
  // Track which players already spawned rings this pounce
  private pounceRingSpawned = new Set<string>();

  // ── Lifecycle ──────────────────────────────────────────────

  init(scene: THREE.Scene): void {
    this.scene = scene;
    this.particles.init(scene);
    this.ambientVfx.init(scene);
    this.fallingLeaves.init(scene);
    this.hidePrompt.init(scene);
    this.scoreFloater.init(scene);
    this.footprints.init(scene);
    this.boundary.init(scene);
  }

  dispose(): void {
    this.playerMeshes.forEach(m => this.scene?.remove(m));
    this.boundary.dispose(this.scene);
    this.playerMeshes.clear();
    this.playerMeshRoles.clear();
    this.previousPositions.clear();
    this.afterimages.forEach(ghost => this.scene?.remove(ghost));
    this.afterimages.clear();
    this.afterimageSlotBySource.clear();
    this.caughtVfxSpawned.clear();
    this.hidingUids.clear();
    this.impactRings.forEach(r => this.scene?.remove(r));
    this.impactRings.clear();
    this.pounceRingSpawned.clear();
    this.surfaceEffects.reset();
    this.mvpCrown.dispose(this.playerMeshes);
    this.animation.dispose();
    this.particles.dispose();
    this.hideRuffle.dispose();
    this.ambientVfx.dispose();
    this.fallingLeaves.dispose();
    this.scoreFloater.dispose();
    this.hidePrompt.dispose();
    this.footprints.dispose();
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

  /** Spawn score floaters for hunter catch rewards. */
  showCatchScore(positions: Vec3[]): void {
    for (const pos of positions) {
      this.scoreFloater.spawn(pos, '+100', '#e9c46a');
    }
  }

  /** Spawn score floaters for hider hiding cost. */
  showHidingCost(positions: Vec3[]): void {
    for (const pos of positions) {
      this.scoreFloater.spawn(pos, '-10', '#ef5350');
    }
  }

  // ── Per-frame sync ─────────────────────────────────────────

  syncPlayers(
    players: PlayerState[],
    localUid: string,
    delta: number,
    localRole: PlayerRole,
    mvpHunterUid: string | null = null,
    mvpHiderUid: string | null = null,
  ): void {
    const activeIds = new Set<string>();
    this.tickAfterimages(delta);
    this.tickImpactRings(delta);

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
      this.syncPounceGroundIndicator(group, player, delta);
      this.syncDashGroundIndicator(group, player, delta);
      this.syncAbilityAfterimages(group, player);
      this.syncBlink(player.uid, group, delta, moveDelta);
      this.spawnCatchEffects(player, isCaughtHider);
      this.spawnFootstepEffects(player, moveDelta);

      this.syncHidingVisuals(group, player, localRole);
      this.detectHideTransition(player);

      // Save position for next frame
      this.previousPositions.set(player.uid, { ...player.position });
    }

    this.mvpCrown.sync(this.playerMeshes, mvpHunterUid, mvpHiderUid, delta);
    this.updateBoundaryProximity(players, localUid);
    this.updatePlayerContactShadows(players);
    this.removeInactiveMeshes(activeIds);
  }

  /** Advance particle effects and ambient VFX. Call once per frame. */
  tickParticles(delta: number): void {
    this.particles.tick(delta);
    this.hideRuffle.tick(delta);
    this.surfaceEffects.tick(delta);
    this.ambientVfx.tick(delta);
    this.fallingLeaves.tick(delta);
    this.scoreFloater.tick(delta);
    this.footprints.tick(delta);
    // Update world-space hide prompt
    this.hidePrompt.update(this.pendingHideSpot, delta);
    this.pendingHideSpot = null;
    this.boundary.tick(delta);
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
    this.surfaceEffects.removePlayer(uid);
    this.caughtVfxSpawned.delete(uid);
    this.removeAfterimagesFor(group.uuid);
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
    const isDashing = player.role === 'hider' && (player as any).isDashing === true;
    const isPouncing = player.role === 'hunter' && (player as any).isPouncing === true;
    this.animation.tick(
      player.uid, group, player.position, prevPos, delta,
      player.isAlive, isCaughtHider, exhausted, isDashing, isPouncing,
    );
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
    const renderPosition = this.getEffectPosition(player.position);
    this.caughtVfxSpawned.add(player.uid);
    this.particles.spawnCatchBurst(renderPosition);
    this.particles.spawnConfetti(renderPosition);
    this.screenShake.trigger(0.3, 0.3);
    this.scoreFloater.spawn(renderPosition, '+100', '#e9c46a');
    this.scoreFloater.spawn(
      { x: renderPosition.x + 0.3, y: renderPosition.y, z: renderPosition.z + 0.3 },
      '+40% Hunger', '#66bb6a',
    );
  }

  private spawnFootstepEffects(player: PlayerState, moveDelta: Vec3): void {
    const animCtx = this.animation.getContext(player.uid);
    if (!animCtx.footstepTriggered || !player.isAlive) return;
    this.surfaceEffects.spawnFootstep(player, animCtx.state === 'run', moveDelta);
  }

  private syncPounceGroundIndicator(group: THREE.Group, player: PlayerState, delta: number): void {
    if (player.role !== 'hunter') {
      this.pounceRingSpawned.delete(player.uid);
      return this.hideGroundIndicator(group, POUNCE_GROUND_WEDGE_NAME);
    }
    const hunter = player as HunterState;
    if (!hunter.isPouncing) {
      this.pounceRingSpawned.delete(player.uid);
      return this.hideGroundIndicator(group, POUNCE_GROUND_WEDGE_NAME);
    }
    const wedge = this.getOrCreatePounceGroundIndicator(group);
    const progress = 1 - hunter.pounceTimeS / HUNTER_POUNCE_DURATION_S;
    const landing = this.getLandingShockwave(progress);
    wedge.visible = true;
    wedge.position.set(0, 0.05, 0.95);
    wedge.rotation.x = -Math.PI / 2;
    wedge.rotation.y = Math.PI;
    const pulse = 1 + Math.sin(Date.now() * 0.04) * 0.04;
    wedge.scale.set((pulse + landing) * 1.05, pulse + landing * 0.8, 1);
    wedge.rotation.z += delta * (0.25 + landing * 1.8);

    this.spawnLandingImpactRings(player.uid, group, progress);
    this.syncPounceIndicatorOpacity(wedge, landing);
  }

  private getOrCreatePounceGroundIndicator(group: THREE.Group): THREE.Object3D {
    const existing = group.getObjectByName(POUNCE_GROUND_WEDGE_NAME);
    if (existing) return existing;
    const wedge = new THREE.Group();
    wedge.name = POUNCE_GROUND_WEDGE_NAME;

    const cone = new THREE.Mesh(
      new THREE.CircleGeometry(0.95, 3, -Math.PI / 3, (Math.PI * 2) / 3),
      new THREE.MeshBasicMaterial({
        color: 0xff8833,
        transparent: true,
        opacity: 0.32,
        depthTest: false,
      }),
    );
    cone.name = 'pounce-cone';

    wedge.add(cone);
    wedge.renderOrder = 50;
    group.add(wedge);
    return wedge;
  }

  private spawnLandingImpactRings(uid: string, group: THREE.Group, progress: number): void {
    if (progress < 0.84 || this.pounceRingSpawned.has(uid)) return;
    this.pounceRingSpawned.add(uid);
    const pos = group.position.clone();
    pos.y = getTerrainHeight(pos.x, pos.z) + 0.06;
    this.spawnWorldImpactRing(pos, 0.1, 2.8, 0.95, 0.45);
    this.spawnWorldImpactRing(pos, 0.05, 2.0, 0.75, 0.35);
    this.spawnWorldImpactRing(pos, 0.02, 1.4, 0.6, 0.28);
  }

  private spawnWorldImpactRing(
    pos: THREE.Vector3,
    startScale: number,
    endScale: number,
    opacity: number,
    life: number,
  ): void {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.0, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity,
        depthTest: false,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    ring.scale.setScalar(startScale);
    ring.renderOrder = 55;
    ring.userData['life'] = life;
    ring.userData['maxLife'] = life;
    ring.userData['startScale'] = startScale;
    ring.userData['endScale'] = endScale;
    ring.userData['startOpacity'] = opacity;
    this.impactRings.add(ring);
    this.scene.add(ring);
  }

  private tickImpactRings(delta: number): void {
    for (const ring of this.impactRings) {
      ring.userData['life'] -= delta;
      const life = ring.userData['life'] as number;
      if (life <= 0) {
        this.scene.remove(ring);
        this.impactRings.delete(ring);
        continue;
      }
      const t = 1 - life / (ring.userData['maxLife'] as number);
      const ease = 1 - (1 - t) * (1 - t);
      const s = ring.userData['startScale'] + ease * (ring.userData['endScale'] - ring.userData['startScale']);
      ring.scale.setScalar(s);
      (ring.material as THREE.MeshBasicMaterial).opacity =
        (ring.userData['startOpacity'] as number) * (1 - ease);
    }
  }

  private syncPounceIndicatorOpacity(wedge: THREE.Object3D, landing: number): void {
    wedge.traverse((child: any) => {
      if (!child.material?.opacity) return;
      child.material.opacity = Math.min(1, 0.32 + landing * 0.28);
    });
  }

  private getLandingShockwave(progress: number): number {
    if (progress <= 0.84 || progress >= 1) return 0;
    const landing = (progress - 0.84) / 0.16;
    return Math.sin(landing * Math.PI) * 0.9;
  }

  private syncDashGroundIndicator(group: THREE.Group, player: PlayerState, delta: number): void {
    if (player.role !== 'hider') return this.hideGroundIndicator(group, DASH_GROUND_LOOP_NAME);
    const hider = player as HiderState;
    if (!hider.isDashing) return this.hideGroundIndicator(group, DASH_GROUND_LOOP_NAME);
    const loop = this.getOrCreateDashGroundIndicator(group);
    loop.visible = true;
    loop.position.set(0, 0.05, 0.72);
    loop.rotation.x = -Math.PI / 2;
    loop.rotation.z += delta * 7;
    const wobble = 1 + Math.sin(Date.now() * 0.06) * 0.09;
    loop.scale.set(1.12 * wobble, 0.82 / wobble, 1);
  }

  private getOrCreateDashGroundIndicator(group: THREE.Group): THREE.Object3D {
    const existing = group.getObjectByName(DASH_GROUND_LOOP_NAME);
    if (existing) return existing;

    const loop = new THREE.Group();
    loop.name = DASH_GROUND_LOOP_NAME;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.05, 8, 22),
      new THREE.MeshBasicMaterial({
        color: 0x66ffee,
        transparent: true,
        opacity: 0.82,
        depthTest: false,
      }),
    );

    const frontLoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.025, 8, 18),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        depthTest: false,
      }),
    );
    frontLoop.position.set(0, 0, 0.34);

    loop.add(ring);
    loop.add(frontLoop);
    loop.renderOrder = 50;
    group.add(loop);
    return loop;
  }

  private syncAbilityAfterimages(group: THREE.Group, player: PlayerState): void {
    if (player.role === 'hunter' && (player as HunterState).isPouncing) {
      const hunter = player as HunterState;
      this.spawnProgressAfterimage(
        group,
        0xffa040,
        0.24,
        0.95,
        0.02,
        1 - hunter.pounceTimeS / HUNTER_POUNCE_DURATION_S,
      );
      return;
    }
    if (player.role === 'hider' && (player as HiderState).isDashing) {
      const hider = player as HiderState;
      const phase = Math.sin(Date.now() * 0.025) * 0.08;
      this.spawnProgressAfterimage(
        group,
        0x66ffee,
        0.2,
        0.72,
        phase,
        1 - hider.dashTimeS / HIDER_DASH_DURATION_S,
      );
      return;
    }
    this.resetAfterimageSampling(group.uuid);
  }

  private spawnProgressAfterimage(
    group: THREE.Group,
    color: number,
    opacity: number,
    zOffset: number,
    xOffset: number,
    progress: number,
  ): void {
    const nextSlot = this.afterimageSlotBySource.get(group.uuid) ?? 0;
    if (nextSlot >= AFTERIMAGE_MAX_PER_PLAYER) return;
    const slotProgress = nextSlot / Math.max(AFTERIMAGE_MAX_PER_PLAYER - 1, 1);
    if (progress + 0.0001 < slotProgress) return;

    const ghost = this.createAfterimageGhost(group);
    const offset = new THREE.Vector3(xOffset, 0, -zOffset).applyQuaternion(group.quaternion);
    const emphasis = this.getAfterimageEmphasis(nextSlot);
    ghost.name = `${AFTERIMAGE_PREFIX}${performance.now()}`;
    ghost.position.copy(group.position).add(offset);
    ghost.quaternion.copy(group.quaternion);
    ghost.scale.multiplyScalar(0.97 + emphasis.scaleBoost);
    ghost.userData['life'] = AFTERIMAGE_LIFE_S;
    ghost.userData['sourceUid'] = group.uuid;
    ghost.traverse((child: any) => {
      if (!child.material) return;
      child.material = child.material.clone();
      child.material.transparent = true;
      child.material.opacity = opacity * emphasis.opacityBoost;
      if (child.material.color) child.material.color.offsetHSL(0, 0, 0.12);
      if (child.material.emissive) child.material.emissive.setHex(color);
      child.renderOrder = 40;
    });
    this.afterimages.add(ghost);
    this.afterimageSlotBySource.set(group.uuid, nextSlot + 1);
    this.scene.add(ghost);
  }

  private getAfterimageEmphasis(slot: number): { opacityBoost: number; scaleBoost: number } {
    const isEdge = slot === 0 || slot === AFTERIMAGE_MAX_PER_PLAYER - 1;
    return isEdge ? { opacityBoost: 1.5, scaleBoost: 0.05 } : { opacityBoost: 0.85, scaleBoost: 0.01 };
  }

  private createAfterimageGhost(group: THREE.Group): THREE.Group {
    const ghost = group.clone(true);
    this.stripHelperChildren(ghost);
    return ghost;
  }

  private stripHelperChildren(group: THREE.Group): void {
    const toRemove = group.children.filter(child =>
      child.name === POUNCE_GROUND_WEDGE_NAME
      || child.name === DASH_GROUND_LOOP_NAME
      || child.name.startsWith(AFTERIMAGE_PREFIX),
    );
    toRemove.forEach(child => group.remove(child));
  }

  private tickAfterimages(delta: number): void {
    for (const ghost of this.afterimages) {
      ghost.userData['life'] -= delta;
      const life = Math.max(ghost.userData['life'], 0);
      ghost.visible = life > 0;
      ghost.position.y += delta * 0.03;
      ghost.scale.multiplyScalar(0.995);
      ghost.traverse((child: any) => {
        if (!child.material?.opacity) return;
        child.material.opacity = Math.min(child.material.opacity, life / AFTERIMAGE_LIFE_S * 0.28);
      });
      if (life > 0) continue;
      this.scene.remove(ghost);
      this.afterimages.delete(ghost);
    }
  }

  private hideGroundIndicator(group: THREE.Group, name: string): void {
    const indicator = group.getObjectByName(name);
    if (!indicator) return;
    indicator.visible = false;
    indicator.scale.set(1, 1, 1);
  }

  private syncHidingVisuals(group: THREE.Group, player: PlayerState, localRole: PlayerRole): void {
    if (player.role !== 'hider') return;
    const hider = player as HiderState;
    if (!hider.isHiding) return this.setGroupOpacity(group, 1.0);
    if (localRole === 'hunter') return void (group.visible = false);
    this.setGroupOpacity(group, 0.35);
  }

  private detectHideTransition(player: PlayerState): void {
    if (player.role !== 'hider') return;
    const hider = player as HiderState;
    const wasHiding = this.hidingUids.has(hider.uid);

    if (hider.isHiding && !wasHiding && hider.hidingSpotId) {
      this.hidingUids.add(hider.uid);
      this.triggerHideRuffle(hider.hidingSpotId);
      return;
    }
    if (!hider.isHiding && wasHiding) {
      this.hidingUids.delete(hider.uid);
    }
  }

  private triggerHideRuffle(spotId: string): void {
    const obs = this.mapService.getMap('jungle').obstacles.find(o => o.id === spotId);
    if (!obs) return;
    this.hideRuffle.trigger(spotId, obs.type);
  }

  private setGroupOpacity(group: THREE.Group, opacity: number): void {
    group.traverse((child: any) => {
      if (!child.material || child.material.opacity === undefined) return;
      child.material.transparent = true;
      child.material.opacity = opacity;
    });
  }

  private getEffectPosition(position: Vec3): Vec3 {
    const terrainY = getTerrainHeight(position.x, position.z);
    return { x: position.x, y: position.y + terrainY, z: position.z };
  }

  private updateBoundaryProximity(players: PlayerState[], localUid: string): void {
    const localPlayer = players.find(p => p.uid === localUid);
    const localPos = localPlayer?.position ?? this.previousPositions.get(localUid) ?? null;
    this.boundary.updateProximity(localPos);
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
      this.removeAfterimagesFor(mesh.uuid);
      this.playerMeshes.delete(uid);
      this.playerMeshRoles.delete(uid);
      this.previousPositions.delete(uid);
      this.animation.removeContext(uid);
      this.surfaceEffects.removePlayer(uid);
      this.caughtVfxSpawned.delete(uid);
    }
  }

  private removeAfterimagesFor(sourceUuid: string): void {
    this.resetAfterimageSampling(sourceUuid);
    for (const ghost of this.afterimages) {
      if (ghost.userData['sourceUid'] !== sourceUuid) continue;
      this.scene.remove(ghost);
      this.afterimages.delete(ghost);
    }
  }

  private resetAfterimageSampling(sourceUuid: string): void {
    this.afterimageSlotBySource.delete(sourceUuid);
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
