import * as THREE from 'three';
import { MapConfig, ObstaclePlacement, DecorationPlacement, WaterPlacement, OBSTACLE_CONFIGS, ObstacleType, DecorationType } from '../models/map.model';
import { buildObstacleMesh } from './mesh/obstacle/obstacle-registry';
import { buildGroundMaterial } from './mesh/ground-texture.builder';
import { buildDecorationMesh } from './mesh/decoration-mesh.builder';
import { buildDappledLight } from './mesh/dappled-light.builder';
import {
  applyHeightmap,
  TERRAIN_SEGMENTS,
  registerWaterDepressions,
} from './mesh/terrain-heightmap.builder';
import { buildInstancedGrass } from './mesh/instanced-grass.builder';
import { buildContactShadows } from './mesh/contact-shadow.builder';
import { placeOnTerrain } from './mesh/terrain-placement';
import { initVehicleLoader } from './mesh/obstacle/vehicle.builder';
import { VEHICLE_GLB_ENTRIES } from './mesh/vehicle-model.config';
import { initFoliageLoader } from './mesh/obstacle/foliage.builder';
import { ALL_FOLIAGE_GLB_ENTRIES } from './mesh/foliage-model.config';
import { initWaterLoader, buildWaterFeatureMesh } from './mesh/obstacle/water-feature.builder';
import { ALL_WATER_GLB_ENTRIES } from './mesh/water-model.config';
import { GlbLoaderService } from './mesh/glb-loader.service';

export interface SceneBuildResult {
  obstacleMeshes: Map<string, THREE.Group>;
  grassMesh: THREE.InstancedMesh | null;
}

export async function buildJungleScene(
  scene: THREE.Scene,
  map: MapConfig,
  glbLoader: GlbLoaderService,
): Promise<SceneBuildResult> {
  const obstacleMeshes = new Map<string, THREE.Group>();
  const safe = (label: string, fn: () => void) => {
    try { fn(); } catch (e) { console.error(`[Engine] ${label} failed:`, e); }
  };

  registerDepressions(map);
  safe('buildGround',       () => buildGround(scene, map));
  safe('buildDappledLight', () => scene.add(buildDappledLight()));
  await preloadVehicleModels(glbLoader);
  await preloadFoliageModels(glbLoader);
  await preloadWaterModels(glbLoader);
  safe('buildObstacles',    () => buildObstacles(scene, map, obstacleMeshes));
  safe('buildDecorations',  () => buildDecorations(scene, map));
  safe('buildWater',        () => buildWater(scene, map));

  let grassMesh: THREE.InstancedMesh | null = null;
  safe('buildInstancedGrass', () => {
    grassMesh = buildGrassLayer(scene, map);
  });
  safe('buildContactShadows', () => buildContactShadows(scene));

  return { obstacleMeshes, grassMesh };
}

// ── Preloading ──────────────────────────────────────────────

async function preloadVehicleModels(glbLoader: GlbLoaderService): Promise<void> {
  initVehicleLoader(glbLoader);
  try { await glbLoader.preloadAll(VEHICLE_GLB_ENTRIES); }
  catch (e) { console.warn('[Engine] Vehicle GLB preload failed — fallback boxes will be used', e); }
}

async function preloadFoliageModels(glbLoader: GlbLoaderService): Promise<void> {
  initFoliageLoader(glbLoader);
  try { await glbLoader.preloadAll(ALL_FOLIAGE_GLB_ENTRIES); }
  catch (e) { console.warn('[Engine] Foliage GLB preload failed — fallback boxes will be used', e); }
}

async function preloadWaterModels(glbLoader: GlbLoaderService): Promise<void> {
  initWaterLoader(glbLoader);
  try { await glbLoader.preloadAll(ALL_WATER_GLB_ENTRIES); }
  catch (e) { console.warn('[Engine] Water GLB preload failed — fallback boxes will be used', e); }
}

// ── Ground ──────────────────────────────────────────────────

function buildGround(scene: THREE.Scene, map: MapConfig): void {
  const geo = new THREE.PlaneGeometry(map.width, map.depth, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
  applyHeightmap(geo);
  const ground = new THREE.Mesh(geo, buildGroundMaterial());
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.renderOrder = 0;
  scene.add(ground);
}

// ── Obstacles ───────────────────────────────────────────────

function buildObstacles(
  scene: THREE.Scene,
  map: MapConfig,
  registry: Map<string, THREE.Group>,
): void {
  for (const obs of map.obstacles) placeObstacle(scene, obs, registry);
}

function placeObstacle(
  scene: THREE.Scene,
  obs: ObstaclePlacement,
  registry: Map<string, THREE.Group>,
): void {
  const group = buildObstacleMesh(obs.type);
  if (!group) return;
  placeOnTerrain(
    group,
    obs.position.x,
    obs.position.z,
    obs.rotationY,
    getObstacleFootprint(obs.type),
    {
      alignToSlope: shouldAlignObstacleToSlope(obs.type),
      clearance: getObstacleClearance(obs.type) + obs.position.y,
      sampleRadius: getObstacleSampleRadius(obs.type),
    },
  );
  group.renderOrder = 2;
  enableShadows(group);
  scene.add(group);
  registry.set(obs.id, group);
}

function enableShadows(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

function getObstacleFootprint(type: ObstacleType): { width: number; depth: number } {
  const size = OBSTACLE_CONFIGS[type].size;
  return { width: size.x, depth: size.z };
}

function getObstacleClearance(type: ObstacleType): number {
  if (type === 'hole') return 0;
  return isVehicle(type) ? 0.08 : 0.02;
}

function shouldAlignObstacleToSlope(type: ObstacleType): boolean {
  return type !== 'tree' && type !== 'bush' && type !== 'hole';
}

function getObstacleSampleRadius(type: ObstacleType): number | undefined {
  return isVehicle(type) ? 1.8 : undefined;
}

function isVehicle(type: ObstacleType): boolean {
  return type === 'sedan';
}

// ── Decorations ─────────────────────────────────────────────

function buildDecorations(scene: THREE.Scene, map: MapConfig): void {
  for (const deco of map.decorations) placeDecoration(scene, deco);
}

function placeDecoration(scene: THREE.Scene, deco: DecorationPlacement): void {
  const group = buildDecorationMesh(deco.type);
  if (!group) return;
  group.scale.setScalar(deco.scale);
  placeOnTerrain(
    group,
    deco.position.x,
    deco.position.z,
    deco.rotationY,
    getDecorationFootprint(deco.type, deco.scale),
    { alignToSlope: shouldAlignDecorationToSlope(deco.type), clearance: deco.position.y },
  );
  group.renderOrder = 1;
  scene.add(group);
}

function getDecorationFootprint(type: DecorationType, scale: number): { width: number; depth: number } {
  const size = type === 'fallen_log' ? { width: 1.9, depth: 0.7 } : { width: 0.9, depth: 0.9 };
  return { width: size.width * scale, depth: size.depth * scale };
}

function shouldAlignDecorationToSlope(type: DecorationType): boolean {
  return type === 'fallen_log' || type === 'vine';
}

// ── Water ───────────────────────────────────────────────────

function buildWater(scene: THREE.Scene, map: MapConfig): void {
  for (const water of map.waterFeatures) placeWaterFeature(scene, water);
}

function registerDepressions(map: MapConfig): void {
  const ponds = map.waterFeatures.filter(w => w.type === 'pond');
  registerWaterDepressions(ponds.map(p => ({ x: p.position.x, z: p.position.z, radius: p.size })));
}

function placeWaterFeature(scene: THREE.Scene, water: WaterPlacement): void {
  const group = buildWaterFeatureMesh(water.size);
  if (!group) return;
  placeOnTerrain(
    group,
    water.position.x,
    water.position.z,
    water.rotationY,
    { width: water.size * 2, depth: water.size * 2 },
    { alignToSlope: false, clearance: water.position.y, useFooting: false },
  );
  scene.add(group);
}

// ── Grass ───────────────────────────────────────────────────

function buildGrassLayer(scene: THREE.Scene, map: MapConfig): THREE.InstancedMesh {
  const mesh = buildInstancedGrass(map.width, map.depth);
  mesh.renderOrder = 1;
  scene.add(mesh);
  return mesh;
}
