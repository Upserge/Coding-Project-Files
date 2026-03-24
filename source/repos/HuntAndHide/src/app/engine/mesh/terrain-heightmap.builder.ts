import * as THREE from 'three';
import { sampleSimplex2D } from './simplex-noise';

const TERRAIN_WARP_SCALE = 0.012;
const TERRAIN_WARP_STRENGTH = 11;
const TERRAIN_BASE_HEIGHT = 3.8;
const TERRAIN_RIDGE_HEIGHT = 1.55;
const TERRAIN_DETAIL_HEIGHT = 0.18;
const TERRAIN_BASE_FREQ = 0.016;
const TERRAIN_RIDGE_FREQ = 0.026;
const TERRAIN_DETAIL_FREQ = 0.05;

const BASIN_SAMPLE_DISTANCE = 6.5;
const BASIN_DEPTH_SCALE = 1.8;

const BASE_GRASS_COLOR = new THREE.Color(0x6f8f57);
const SUNNY_HILL_COLOR = new THREE.Color(0xc7bc7e);
const VALLEY_SHADOW_COLOR = new THREE.Color(0x43533c);
const ROCK_COLOR = new THREE.Color(0x6f695e);
const WORLD_UP = new THREE.Vector3(0, 1, 0);

/** How far beyond the water feature edge the shore blends back to natural terrain. */
const WATER_SHORE_BLEND = 2.5;
/** How far below center height the water bowl dips. */
const WATER_BOWL_DEPTH = 0.35;

export const TERRAIN_SEGMENTS = 160;

/**
 * Terrain heightmap using layered simplex noise.
 *
 * Provides:
 *  - `getTerrainHeight(x, z)` — world-space height at any XZ coordinate
 *  - `applyHeightmap(geo, width, depth)` — displaces PlaneGeometry vertices
 *
 * The PlaneGeometry must be in its default XY orientation
 * (pre-rotation). After the mesh is rotated −90° on X, the displaced
 * Z vertices become world Y.
 */

// ── Water depression registry ───────────────────────────────

interface WaterDepression {
  x: number;
  z: number;
  radius: number;
}

let waterDepressions: WaterDepression[] = [];

/** Register pond positions so the heightmap can carve depressions. Call before applyHeightmap. */
export function registerWaterDepressions(ponds: { x: number; z: number; radius: number }[]): void {
  waterDepressions = ponds.map(p => ({ ...p }));
}

/** Clear registered depressions (call on map reset). */
export function clearWaterDepressions(): void {
  waterDepressions = [];
}

// ── Height function ─────────────────────────────────────────

/** Return the terrain height at a given world XZ coordinate. */
export function getTerrainHeight(x: number, z: number): number {
  const warped = getWarpedTerrainCoords(x, z);
  const raw = sampleBaseTerrain(warped.x, warped.z) + sampleRidgeTerrain(warped.x, warped.z) + sampleDetailTerrain(warped.x, warped.z);
  return applyWaterDepressions(x, z, raw);
}

export function getTerrainNormal(x: number, z: number, sampleDistance = 1.25): THREE.Vector3 {
  const north = getTerrainHeight(x, z - sampleDistance);
  const south = getTerrainHeight(x, z + sampleDistance);
  const east = getTerrainHeight(x + sampleDistance, z);
  const west = getTerrainHeight(x - sampleDistance, z);
  return new THREE.Vector3(west - east, sampleDistance * 2, north - south).normalize();
}

export function getTerrainAlignedQuaternion(x: number, z: number, yaw: number, sampleDistance = 1.25): THREE.Quaternion {
  const tilt = new THREE.Quaternion().setFromUnitVectors(WORLD_UP, getTerrainNormal(x, z, sampleDistance));
  const spin = new THREE.Quaternion().setFromAxisAngle(WORLD_UP, yaw);
  return tilt.multiply(spin);
}

function getWarpedTerrainCoords(x: number, z: number): { x: number; z: number } {
  const warpX = sampleSimplex2D(x * TERRAIN_WARP_SCALE + 19.4, z * TERRAIN_WARP_SCALE - 8.7);
  const warpZ = sampleSimplex2D(x * TERRAIN_WARP_SCALE - 14.2, z * TERRAIN_WARP_SCALE + 27.1);
  return { x: x + warpX * TERRAIN_WARP_STRENGTH, z: z + warpZ * TERRAIN_WARP_STRENGTH };
}

function sampleBaseTerrain(x: number, z: number): number {
  return sampleFractalNoise(x * TERRAIN_BASE_FREQ, z * TERRAIN_BASE_FREQ, 4, 2.05, 0.5) * TERRAIN_BASE_HEIGHT;
}

function sampleRidgeTerrain(x: number, z: number): number {
  return (sampleRidgedNoise(x * TERRAIN_RIDGE_FREQ + 43, z * TERRAIN_RIDGE_FREQ - 31) - 0.5) * TERRAIN_RIDGE_HEIGHT;
}

function sampleDetailTerrain(x: number, z: number): number {
  return sampleFractalNoise(x * TERRAIN_DETAIL_FREQ, z * TERRAIN_DETAIL_FREQ, 2, 2.1, 0.42) * TERRAIN_DETAIL_HEIGHT;
}

function sampleFractalNoise(
  x: number,
  z: number,
  octaves: number,
  lacunarity: number,
  gain: number,
): number {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let weight = 0;
  for (let octave = 0; octave < octaves; octave++) {
    total += sampleSimplex2D(x * frequency, z * frequency) * amplitude;
    weight += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return total / weight;
}

function sampleRidgedNoise(x: number, z: number): number {
  return 1 - Math.abs(sampleFractalNoise(x, z, 3, 2.1, 0.55));
}

// ── Water depressions ───────────────────────────────────────

/** Smoothly depress terrain inside pond boundaries. */
function applyWaterDepressions(x: number, z: number, rawHeight: number): number {
  let result = rawHeight;
  for (const dep of waterDepressions) {
    result = applyOneDepression(x, z, result, dep);
  }
  return result;
}

function applyOneDepression(x: number, z: number, height: number, dep: WaterDepression): number {
  const dx = x - dep.x;
  const dz = z - dep.z;
  const edgeDist = Math.sqrt(dx * dx + dz * dz) - dep.radius;
  if (edgeDist >= WATER_SHORE_BLEND) return height;
  const centerHeight = getRawTerrainHeight(dep.x, dep.z) - WATER_BOWL_DEPTH;
  if (edgeDist <= 0) return centerHeight;
  return centerHeight + (height - centerHeight) * smoothstep(edgeDist / WATER_SHORE_BLEND);
}

/** Raw terrain height without depressions (avoids recursion). */
function getRawTerrainHeight(x: number, z: number): number {
  const warped = getWarpedTerrainCoords(x, z);
  return sampleBaseTerrain(warped.x, warped.z) + sampleRidgeTerrain(warped.x, warped.z) + sampleDetailTerrain(warped.x, warped.z);
}

function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

// ── Geometry displacement ───────────────────────────────────

/**
 * Displace vertices of a horizontal PlaneGeometry according to the
 * terrain height function.
 *
 * The plane lies in the XY plane (Three.js default).
 * After the caller rotates the mesh −90° on X:
 *   local X → world X,  local Y → world −Z,  local Z → world Y
 *
 * So we read local X/Y to derive world XZ and write the height
 * into local Z.
 */
export function applyHeightmap(geo: THREE.PlaneGeometry): void {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;

  // Pass 1 — displace vertices and track height range
  let minH = Infinity;
  let maxH = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const localX = pos.getX(i);
    const localY = pos.getY(i);
    const worldZ = -localY;
    const h = getTerrainHeight(localX, worldZ);
    pos.setZ(i, h);
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.setAttribute('color', buildTerrainColors(pos, minH, maxH, geo));
}

function buildTerrainColors(
  pos: THREE.BufferAttribute,
  minHeight: number,
  maxHeight: number,
  geo: THREE.PlaneGeometry,
): THREE.BufferAttribute {
  const normals = geo.getAttribute('normal') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const range = maxHeight - minHeight || 1;
  for (let index = 0; index < pos.count; index++) writeTerrainColor(index, pos, normals, range, minHeight, colors);
  return new THREE.BufferAttribute(colors, 3);
}

function writeTerrainColor(
  index: number,
  pos: THREE.BufferAttribute,
  normals: THREE.BufferAttribute,
  range: number,
  minHeight: number,
  colors: Float32Array,
): void {
  const heightT = (pos.getZ(index) - minHeight) / range;
  const slopeT = clamp01(1 - Math.max(0, normals.getZ(index)));
  const basinT = sampleBasinDepth(pos.getX(index), -pos.getY(index));
  const color = blendTerrainColor(heightT, slopeT, basinT);
  colors[index * 3] = color.r;
  colors[index * 3 + 1] = color.g;
  colors[index * 3 + 2] = color.b;
}

function sampleBasinDepth(x: number, z: number): number {
  const center = getTerrainHeight(x, z);
  const ring = sampleTerrainRing(x, z);
  return smooth01(clamp01((ring - center) / BASIN_DEPTH_SCALE));
}

function sampleTerrainRing(x: number, z: number): number {
  const offset = BASIN_SAMPLE_DISTANCE;
  const north = getTerrainHeight(x, z - offset);
  const south = getTerrainHeight(x, z + offset);
  const east = getTerrainHeight(x + offset, z);
  const west = getTerrainHeight(x - offset, z);
  return (north + south + east + west) * 0.25;
}

function blendTerrainColor(heightT: number, slopeT: number, basinT: number): THREE.Color {
  const valleyDepth = smooth01(clamp01((0.49 - heightT) * 1.1));
  const valleyShade = smooth01(clamp01(valleyDepth * 0.54 + basinT * 0.32));
  const hillSun = smooth01(clamp01((heightT - 0.51) * 1.18)) * (1 - slopeT * 0.82);
  const rockBlend = smooth01(clamp01((slopeT - 0.42) * 0.72)) * (1 - hillSun * 0.55);
  return BASE_GRASS_COLOR.clone()
    .lerp(VALLEY_SHADOW_COLOR, valleyShade)
    .lerp(SUNNY_HILL_COLOR, hillSun)
    .lerp(ROCK_COLOR, rockBlend);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smooth01(value: number): number {
  return value * value * (3 - 2 * value);
}
