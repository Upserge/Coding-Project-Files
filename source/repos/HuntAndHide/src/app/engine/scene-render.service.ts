import { inject, Injectable } from '@angular/core';
import * as THREE from 'three';
import { PlayerState, HiderState, DecoyState, Vec3, PlayerRole } from '../models/player.model';
import { Item, isVisibleForRole } from '../models/item.model';
import { ProjectileState } from '../services/hunter.service';

import { ANIMAL_COLORS, BELLY_COLORS, HUNTER_BODY_COLOR, HIDER_BODY_COLOR } from './mesh/animal-palettes';
import { buildNameSprite, applyRimLighting } from './mesh/mesh-helpers';
import { buildHunterMesh } from './mesh/hunter-mesh.builder';
import { buildHiderMesh } from './mesh/hider-mesh.builder';
import { buildItemMesh, buildProjectileMesh } from './mesh/prop-mesh.builder';
import { tickWaterShaders } from './mesh/water-mesh.builder';
import { getTerrainHeight } from './mesh/terrain-heightmap.builder';
import { updateContactShadows } from './mesh/contact-shadow.builder';
import { ProceduralAnimationService } from './animation/procedural-animation.service';
import { ParticleVfxService } from './animation/particle-vfx.service';
import { AmbientVfxService } from './animation/ambient-vfx.service';
import { FallingLeavesService } from './animation/falling-leaves.service';
import { MapService } from '../services/map.service';

/** Interval (in frames) between movement-dust spawns to avoid particle overload. */
const DUST_FRAME_INTERVAL = 6;

/**
 * SceneRenderService creates and syncs Three.js meshes for players,
 * items, and projectiles each frame based on GameLoopService signals.
 *
 * Mesh building is delegated to focused builder modules under `engine/mesh/`.
 * Animation is driven by ProceduralAnimationService + ParticleVfxService.
 *
 * Call `init(scene)` once, then the `sync*` methods every frame from the tick.
 */
@Injectable({ providedIn: 'root' })
export class SceneRenderService {

  private readonly animation = inject(ProceduralAnimationService);
  private readonly particles = inject(ParticleVfxService);
  private readonly ambientVfx = inject(AmbientVfxService);
  private readonly fallingLeaves = inject(FallingLeavesService);
  private readonly mapService = inject(MapService);

  private scene!: THREE.Scene;

  // Mesh registries keyed by entity id
  private playerMeshes = new Map<string, THREE.Group>();
  private previousPositions = new Map<string, Vec3>();
  private itemMeshes   = new Map<string, THREE.Object3D>();
  private projMeshes   = new Map<string, THREE.Mesh>();
  private decoyMeshes  = new Map<string, THREE.Group>();

  private dustFrameCounter = 0;
  private previousActiveItems = new Map<string, string | null>();
  private waterElapsed = 0;
  // Boundary visual
  private boundaryGroup?: THREE.Group;
  private boundaryMaterial?: THREE.MeshBasicMaterial;
  private boundaryPulse = 0;
  private readonly boundaryBaseOpacity = 0.12;
  private readonly boundaryAmplitude = 0.08;
  // Proximity-based fade
  private boundaryProximity = 0; // 0..1
  private readonly boundaryProximityThreshold = 12; // world units from edge to start fading
  private readonly boundaryMinOpacity = 0.02;

  // ── Lifecycle ──────────────────────────────────────────────

  init(scene: THREE.Scene): void {
    this.scene = scene;
    this.particles.init(scene);
    this.ambientVfx.init(scene);
    this.fallingLeaves.init(scene);
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

    // Render last and on top to avoid any depth-sorting / UI bleed-through issues
    // Force render order and per-child settings so the boundary always
    // draws on top of other scene geometry (including sprites/nameplates).
    this.boundaryGroup.traverse((c: any) => {
      c.renderOrder = 999999;
      if (c.material) {
        c.material.depthTest = false;
        c.material.depthWrite = false;
        c.material.transparent = true;
        c.material.blending = THREE.NormalBlending;
      }
    });

    this.scene.add(this.boundaryGroup);
  }

  dispose(): void {
    this.playerMeshes.forEach(m => this.scene?.remove(m));
    this.itemMeshes.forEach(m => this.scene?.remove(m));
    this.projMeshes.forEach(m => this.scene?.remove(m));
    this.decoyMeshes.forEach(m => this.scene?.remove(m));
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
    this.previousPositions.clear();
    this.previousActiveItems.clear();
    this.itemMeshes.clear();
    this.projMeshes.clear();
    this.decoyMeshes.clear();
    this.animation.dispose();
    this.particles.dispose();
    this.ambientVfx.dispose();
    this.fallingLeaves.dispose();
  }

  // ── Per-frame sync ─────────────────────────────────────────

  syncPlayers(players: PlayerState[], localUid: string, delta: number): void {
    const activeIds = new Set<string>();

    for (const player of players) {
      activeIds.add(player.uid);
      let group = this.playerMeshes.get(player.uid);

      if (!group) {
        group = this.buildPlayerMesh(player);
        this.playerMeshes.set(player.uid, group);
        this.scene.add(group);
      }

      // Store previous position for animation velocity derivation
      const prevPos = this.previousPositions.get(player.uid) ?? player.position;

      // Position — offset Y by terrain height so players walk along the ground surface
      const terrainY = getTerrainHeight(player.position.x, player.position.z);
      group.position.set(player.position.x, player.position.y + terrainY, player.position.z);

      // Face movement direction with smooth turning.
      // Compute movement vector from previous position and, when moving,
      // smoothly slerp the group toward the movement heading. When idle
      // use server-provided `player.rotation.y` (if present) as a gentle
      // fallback so remote-controlled rotations still apply.
      const dxForFacing = player.position.x - prevPos.x;
      const dzForFacing = player.position.z - prevPos.z;

      // Tunable turning parameters
      const MOVE_THRESHOLD = 0.000001; // squared distance threshold to consider movement
      const TURN_RESPONSE = 20; // smoothing responsiveness (higher = faster)
      const TURN_MAX_STEP = 1; // safety clamp for slerp factor

      if (dxForFacing * dxForFacing + dzForFacing * dzForFacing > MOVE_THRESHOLD) {
        const targetY = Math.atan2(dxForFacing, dzForFacing);
        const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, targetY, 0));
        // Exponential smoothing to produce a smooth, frame-rate independent turn curve.
        const t = 1 - Math.exp(-TURN_RESPONSE * delta);
        group.quaternion.slerp(targetQuat, Math.min(TURN_MAX_STEP, t));
      }

      // Visibility
      group.visible = player.isAlive;

      // Local player indicator ring
      const ring = group.getObjectByName('localRing');
      if (ring) ring.visible = player.uid === localUid;

      // Pulse CPU indicator ring
      const cpuRing = group.getObjectByName('cpuRing') as THREE.Mesh | null;
      if (cpuRing?.material) {
        (cpuRing.material as THREE.MeshBasicMaterial).opacity =
          0.45 + Math.sin(Date.now() * 0.004) * 0.25;
      }

      // Drive procedural animation
      this.animation.tick(player.uid, group, player.position, prevPos, delta, player.isAlive);

      // Spawn dust puffs when moving
      this.dustFrameCounter++;
      if (this.dustFrameCounter >= DUST_FRAME_INTERVAL) {
        const dx = player.position.x - prevPos.x;
        const dz = player.position.z - prevPos.z;
        if (dx * dx + dz * dz > 0.001) {
          this.particles.spawnDustPuff(player.position);
          this.dustFrameCounter = 0;
        }
      }

      // Active-item VFX (hiders only)
      if (player.role === 'hider') {
        const hider = player as HiderState;
        const prevItem = this.previousActiveItems.get(hider.uid) ?? null;

        // One-shot smoke cloud on smoke_bomb activation
        if (hider.activeItem === 'smoke_bomb' && prevItem !== 'smoke_bomb') {
          this.particles.spawnSmokeCloud(hider.position);
        }

        // Continuous speed trail while speed_burst is active
        if (hider.activeItem === 'speed_burst') {
          this.particles.spawnSpeedTrail(hider.position);
        }

        this.previousActiveItems.set(hider.uid, hider.activeItem);
      }

      // Save position for next frame
      this.previousPositions.set(player.uid, { ...player.position });
    }

    // Update boundary proximity based on local player position
    const localPlayer = players.find(p => p.uid === localUid);
    const localPos = localPlayer ? localPlayer.position : this.previousPositions.get(localUid) ?? null;
    if (localPos) {
      const map = this.mapService.getMap('jungle');
      const halfW = map.width / 2;
      const halfD = map.depth / 2;
      const distToEdgeX = halfW - Math.abs(localPos.x);
      const distToEdgeZ = halfD - Math.abs(localPos.z);
      const nearest = Math.min(distToEdgeX, distToEdgeZ);
      const t = Math.max(0, Math.min(1, (this.boundaryProximityThreshold - nearest) / this.boundaryProximityThreshold));
      this.boundaryProximity = t;
    } else {
      this.boundaryProximity = 0;
    }

    // Update contact shadow decals for alive players
    const shadowPositions: { x: number; z: number; scale?: number }[] = [];
    for (const player of players) {
      if (player.isAlive) {
        shadowPositions.push({ x: player.position.x, z: player.position.z });
      }
    }
    updateContactShadows(shadowPositions);

    // Remove meshes for players no longer present
    for (const [uid, mesh] of this.playerMeshes) {
      if (!activeIds.has(uid)) {
        this.scene.remove(mesh);
        this.playerMeshes.delete(uid);
        this.previousPositions.delete(uid);
        this.previousActiveItems.delete(uid);
        this.animation.removeContext(uid);
      }
    }
  }

  syncItems(items: Item[], localRole: PlayerRole): void {
    const activeIds = new Set<string>();

    for (const item of items) {
      if (item.isPickedUp) {
        const existing = this.itemMeshes.get(item.id);
        if (existing) {
          // Sparkle on pickup (one-shot: only when transitioning to picked-up)
          if (existing.visible) {
            this.particles.spawnPickupSparkle(item.position);
          }
          existing.visible = false;
        }
        activeIds.add(item.id);
        continue;
      }

      activeIds.add(item.id);
      let mesh = this.itemMeshes.get(item.id);

      if (!mesh) {
        mesh = buildItemMesh(item.type);
        mesh.renderOrder = 3;
        this.itemMeshes.set(item.id, mesh);
        this.scene.add(mesh);
      }

      // Hide items that don't belong to the local player's role
      if (!isVisibleForRole(item.type, localRole)) {
        mesh.visible = false;
        continue;
      }

      const itemTerrainY = getTerrainHeight(item.position.x, item.position.z);
      mesh.position.set(item.position.x, item.position.y + 0.4 + itemTerrainY, item.position.z);
      mesh.visible = true;

      // Gentle bob + spin
      mesh.rotation.y += 0.02;
      mesh.position.y += Math.sin(Date.now() * 0.003 + item.position.x) * 0.05;
    }

    for (const [id, mesh] of this.itemMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.itemMeshes.delete(id);
      }
    }
  }

  syncProjectiles(projectiles: ProjectileState[]): void {
    const activeIds = new Set<string>();

    for (const proj of projectiles) {
      activeIds.add(proj.id);
      let mesh = this.projMeshes.get(proj.id);

      if (!mesh) {
        mesh = buildProjectileMesh(proj.type);
        mesh.renderOrder = 3;
        this.projMeshes.set(proj.id, mesh);
        this.scene.add(mesh);
      }

      const projTerrainY = getTerrainHeight(proj.position.x, proj.position.z);
      mesh.position.set(proj.position.x, proj.position.y + 0.5 + projTerrainY, proj.position.z);
    }

    for (const [id, mesh] of this.projMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.projMeshes.delete(id);
      }
    }
  }

  syncDecoys(decoys: DecoyState[]): void {
    const activeIds = new Set<string>();

    for (const decoy of decoys) {
      activeIds.add(decoy.id);
      let group = this.decoyMeshes.get(decoy.id);

      if (!group) {
        group = new THREE.Group();
        const color = ANIMAL_COLORS[decoy.animal];
        const belly = BELLY_COLORS[decoy.animal];
        buildHiderMesh(group, color, belly, decoy.animal);

        // Hider-accent ring at feet
        const ringGeo = new THREE.RingGeometry(0.55, 0.68, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: HIDER_BODY_COLOR, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        group.add(ring);

        const label = buildNameSprite(decoy.displayName, false, false);
        label.position.set(0, 2.4, 0);
        group.add(label);

        group.renderOrder = 3;
        group.layers.enable(1);
        applyRimLighting(group);
        this.decoyMeshes.set(decoy.id, group);
        this.scene.add(group);
      }

      const terrainY = getTerrainHeight(decoy.position.x, decoy.position.z);
      group.position.set(decoy.position.x, decoy.position.y + terrainY, decoy.position.z);

      // Face movement direction
      const targetY = Math.atan2(decoy.direction.x, decoy.direction.z);
      group.rotation.y = targetY;
    }

    for (const [id, mesh] of this.decoyMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.decoyMeshes.delete(id);
      }
    }
  }

  /** Advance particle effects and ambient VFX. Call once per frame. */
  tickParticles(delta: number): void {
    this.particles.tick(delta);
    this.ambientVfx.tick(delta);
    this.fallingLeaves.tick(delta);
    this.waterElapsed += delta;
    tickWaterShaders(this.waterElapsed);
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

    if (isHunter) {
      buildHunterMesh(group, color, belly, player.animal);
    } else {
      buildHiderMesh(group, color, belly, player.animal);
    }

    // Role-accent ring at feet
    const ringGeo = new THREE.RingGeometry(0.55, 0.68, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isHunter ? HUNTER_BODY_COLOR : HIDER_BODY_COLOR,
      side: THREE.DoubleSide,
    });
    const rolering = new THREE.Mesh(ringGeo, ringMat);
    rolering.rotation.x = -Math.PI / 2;
    rolering.position.y = 0.02;
    group.add(rolering);

    // CPU indicator ring (purple, pulsing handled in syncPlayers)
    if (player.isCpu) {
      const cpuGeo = new THREE.RingGeometry(0.90, 1.05, 24);
      const cpuMat = new THREE.MeshBasicMaterial({
        color: 0x7850c8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const cpuRing = new THREE.Mesh(cpuGeo, cpuMat);
      cpuRing.rotation.x = -Math.PI / 2;
      cpuRing.position.y = 0.01;
      cpuRing.name = 'cpuRing';
      group.add(cpuRing);
    }

    // Local-player gold ring
    const localGeo = new THREE.RingGeometry(0.72, 0.88, 24);
    const localMat = new THREE.MeshBasicMaterial({ color: 0xe9c46a, side: THREE.DoubleSide });
    const localRing = new THREE.Mesh(localGeo, localMat);
    localRing.rotation.x = -Math.PI / 2;
    localRing.position.y = 0.03;
    localRing.name = 'localRing';
    localRing.visible = false;
    group.add(localRing);

    // Floating name label
    const label = buildNameSprite(player.displayName, isHunter, player.isCpu);
    label.position.set(0, 2.4, 0);
    group.add(label);

    group.castShadow = true;
    group.renderOrder = 3;
    // Enable layer 1 so the scene-graph traversal reaches the name-label sprite
    group.layers.enable(1);
    applyRimLighting(group);
    return group;
  }
}
