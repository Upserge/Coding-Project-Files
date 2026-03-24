import * as THREE from 'three';
import { WaterFeatureType } from '../../models/map.model';
import {
  STREAM_BED_WIDTH,
  STREAM_SURFACE_WIDTH,
  WATER_SHORE_OFFSET,
  WATER_SURFACE_OFFSET,
} from '../../models/water-feature.model';
import { buildWaterNormalMap } from './procedural-normal.builder';
import { markTerrainAnchor, markTerrainSurface } from './terrain-placement';

/** Palette for water feature accents. */
const SHORE_COLOR = 0x795548;
const LILY_GREEN = 0x388e3c;
const LILY_FLOWER = 0xf48fb1;
const WATER_DEEP = 0x0288d1;
const POND_GRID_SEGMENTS = 44;
const STREAM_WIDTH_SEGMENTS = 14;
const STREAM_LENGTH_SEGMENTS = 88;
const POND_MASK_SIZE = 128;
const STREAM_BLEND = 1;

/** Map-based dispatch for water feature builders. */
const WATER_BUILDERS: Record<WaterFeatureType, (size: number) => THREE.Group> = {
  pond:   buildPond,
  stream: buildStream,
};

/** Build a water feature mesh by type and size. */
export function buildWaterMesh(type: WaterFeatureType, size: number): THREE.Group | null {
  const builder = WATER_BUILDERS[type];
  return builder ? builder(size) : null;
}

// ── PBR water material (works on both WebGL + WebGPU) ───────

/** Shared normal map instance (created lazily, tiled). */
let sharedWaterNormal: THREE.CanvasTexture | null = null;

function getWaterNormalMap(): THREE.CanvasTexture {
  if (!sharedWaterNormal) {
    sharedWaterNormal = buildWaterNormalMap(256);
    sharedWaterNormal.wrapS = THREE.RepeatWrapping;
    sharedWaterNormal.wrapT = THREE.RepeatWrapping;
    sharedWaterNormal.repeat.set(3, 3);
  }
  return sharedWaterNormal;
}

/** Collect all water materials for per-frame normal-map offset updates. */
const waterMaterials: THREE.MeshStandardMaterial[] = [];
let waterResetDone = false;

function createWaterMaterial(): THREE.MeshStandardMaterial {
  // Clear stale refs from previous scene build (once per build cycle)
  if (!waterResetDone) {
    waterMaterials.length = 0;
    sharedWaterNormal = null;
    waterResetDone = true;
    queueMicrotask(() => { waterResetDone = false; });
  }
  const normalMap = getWaterNormalMap();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x2a9fd6,
    transparent: true,
    opacity: 0.72,
    roughness: 0.12,
    metalness: 0.35,
    envMapIntensity: 1.5,
    normalMap,
    normalScale: new THREE.Vector2(0.6, 0.6),
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  waterMaterials.push(mat);
  return mat;
}

/** Call from the render loop to advance water ripple animation. */
export function tickWaterShaders(elapsed: number): void {
  for (const mat of waterMaterials) {
    if (mat.normalMap) {
      mat.normalMap.offset.x = elapsed * 0.018;
      mat.normalMap.offset.y = elapsed * 0.012;
    }
    mat.opacity = 0.65 + Math.sin(elapsed * 1.8) * 0.08;
  }
}

const pondMaskCache = new Map<string, THREE.CanvasTexture>();

function getPondMask(innerRatio = 0): THREE.CanvasTexture {
  const key = innerRatio.toFixed(3);
  const cached = pondMaskCache.get(key);
  if (cached) return cached;
  const texture = buildPondMask(innerRatio);
  pondMaskCache.set(key, texture);
  return texture;
}

function buildPondMask(innerRatio: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = POND_MASK_SIZE;
  canvas.height = POND_MASK_SIZE;
  const ctx = canvas.getContext('2d')!;
  const half = POND_MASK_SIZE * 0.5;
  ctx.clearRect(0, 0, POND_MASK_SIZE, POND_MASK_SIZE);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.fill();
  if (innerRatio <= 0) return new THREE.CanvasTexture(canvas);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(half, half, half * innerRatio, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return new THREE.CanvasTexture(canvas);
}

// ── Pond ────────────────────────────────────────────────────

function buildPond(radius: number): THREE.Group {
  const group = new THREE.Group();
  group.add(buildPondSurface(radius));
  group.add(buildPondShallows(radius));
  group.add(buildShoreRing(radius));
  addLilyPads(group, radius);
  return group;
}

function buildPondSurface(radius: number): THREE.Mesh {
  const mesh = new THREE.Mesh(buildPondPlane(radius * 2), createWaterMaterial());
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WATER_SURFACE_OFFSET;
  applyPondMask(mesh.material as THREE.MeshStandardMaterial, getPondMask());
  return markTerrainSurface(mesh, WATER_SURFACE_OFFSET);
}

function buildPondShallows(radius: number): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x7de3d6,
    transparent: true,
    opacity: 0.24,
    roughness: 0.75,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(buildPondPlane(radius * 1.88), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WATER_SHORE_OFFSET;
  applyPondMask(mat, getPondMask());
  return markTerrainSurface(mesh, WATER_SHORE_OFFSET);
}

function buildShoreRing(radius: number): THREE.Mesh {
  const outerRadius = radius + 0.5;
  const mat = new THREE.MeshStandardMaterial({
    color: SHORE_COLOR,
    transparent: true,
    roughness: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(buildPondPlane(outerRadius * 2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WATER_SHORE_OFFSET;
  applyPondMask(mat, getPondMask(radius / outerRadius));
  return markTerrainSurface(mesh, WATER_SHORE_OFFSET);
}

function buildPondPlane(size: number): THREE.PlaneGeometry {
  return new THREE.PlaneGeometry(size, size, POND_GRID_SEGMENTS, POND_GRID_SEGMENTS);
}

function applyPondMask(material: THREE.MeshStandardMaterial, mask: THREE.CanvasTexture): void {
  material.alphaMap = mask;
  material.alphaTest = 0.22;
}

function addLilyPads(group: THREE.Group, radius: number): void {
  const padGeo = new THREE.CircleGeometry(0.3, 8);
  const padMat = new THREE.MeshStandardMaterial({ color: LILY_GREEN, side: THREE.DoubleSide });
  const count = Math.floor(radius * 0.8);
  for (let i = 0; i < count; i++) {
    placeLilyPad(group, padGeo, padMat, i, count, radius);
  }
}

function placeLilyPad(
  group: THREE.Group,
  geo: THREE.CircleGeometry,
  mat: THREE.MeshStandardMaterial,
  index: number,
  total: number,
  radius: number,
): void {
  const angle = (index / total) * Math.PI * 2 + Math.random() * 0.5;
  const dist = radius * (0.3 + Math.random() * 0.5);
  const pad = new THREE.Mesh(geo, mat);
  pad.position.set(Math.cos(angle) * dist, 0.02, Math.sin(angle) * dist);
  pad.rotation.x = -Math.PI / 2;
  group.add(markTerrainSurface(pad, 0.02));
  addLilyFlower(group, pad.position);
}

function addLilyFlower(group: THREE.Group, pos: THREE.Vector3): void {
  const shouldSpawn = Math.random() > 0.5;
  if (!shouldSpawn) return;
  const geo = new THREE.SphereGeometry(0.06, 4, 3);
  const mat = new THREE.MeshStandardMaterial({ color: LILY_FLOWER });
  const flower = new THREE.Mesh(geo, mat);
  flower.position.set(pos.x + 0.1, pos.y + 0.03, pos.z);
  group.add(markTerrainAnchor(flower, 0.05));
}

// ── Stream ──────────────────────────────────────────────────

function buildStream(length: number): THREE.Group {
  const group = new THREE.Group();
  group.add(buildStreamSurface(length));
  group.add(buildStreamShallows(length));
  group.add(buildStreamBed(length));
  addStreamPebbles(group, length);
  return group;
}

function buildStreamSurface(length: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(STREAM_SURFACE_WIDTH, length, STREAM_WIDTH_SEGMENTS, STREAM_LENGTH_SEGMENTS);
  const mesh = new THREE.Mesh(geo, createWaterMaterial());
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WATER_SURFACE_OFFSET;
  softenStreamSurface(mesh, WATER_SURFACE_OFFSET);
  return markTerrainSurface(mesh, WATER_SURFACE_OFFSET);
}

function buildStreamShallows(length: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(STREAM_SURFACE_WIDTH * 0.92, length * 0.96, STREAM_WIDTH_SEGMENTS, STREAM_LENGTH_SEGMENTS);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x7de3d6,
    transparent: true,
    opacity: 0.22,
    roughness: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WATER_SHORE_OFFSET;
  softenStreamSurface(mesh, WATER_SHORE_OFFSET);
  return markTerrainSurface(mesh, WATER_SHORE_OFFSET);
}

function buildStreamBed(length: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(STREAM_BED_WIDTH, length + 0.6, STREAM_WIDTH_SEGMENTS, STREAM_LENGTH_SEGMENTS);
  const mat = new THREE.MeshStandardMaterial({ color: WATER_DEEP, roughness: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.02;
  softenStreamSurface(mesh, -0.02);
  return markTerrainSurface(mesh, -0.02);
}

function softenStreamSurface(mesh: THREE.Mesh, offset: number): void {
  mesh.userData['terrainSurfaceBlend'] = STREAM_BLEND;
  mesh.userData['terrainSurfaceOffset'] = offset;
}

function addStreamPebbles(group: THREE.Group, length: number): void {
  const geo = new THREE.DodecahedronGeometry(0.1, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 1, flatShading: true });
  for (let i = 0; i < 6; i++) {
    const pebble = new THREE.Mesh(geo, mat);
    const scale = 0.5 + Math.random() * 0.8;
    pebble.position.set(
      (Math.random() - 0.5) * 1.5,
      WATER_SHORE_OFFSET,
      (Math.random() - 0.5) * length * 0.8,
    );
    pebble.scale.setScalar(scale);
    group.add(markTerrainAnchor(pebble, WATER_SHORE_OFFSET + scale * 0.08));
  }
}
