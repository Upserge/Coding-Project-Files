import * as THREE from 'three';
import { getTerrainAlignedQuaternion, getTerrainHeight } from './terrain-heightmap.builder';

const FOOTING_SAMPLES: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];
const UP_AXIS = new THREE.Vector3(0, 1, 0);
const TERRAIN_SURFACE_OFFSET = 'terrainSurfaceOffset';
const TERRAIN_SURFACE_SOURCE = 'terrainSurfaceSource';
const TERRAIN_SURFACE_BLEND = 'terrainSurfaceBlend';
const TERRAIN_ANCHOR_OFFSET = 'terrainAnchorOffset';
const TERRAIN_ANCHOR_SOURCE = 'terrainAnchorSource';

export interface TerrainFootprint {
  width: number;
  depth: number;
}

export interface TerrainPlacementOptions {
  alignToSlope?: boolean;
  clearance?: number;
  sampleRadius?: number;
  useFooting?: boolean;
}

export function markTerrainSurface<T extends THREE.Mesh>(mesh: T, offset = 0): T {
  mesh.userData[TERRAIN_SURFACE_OFFSET] = offset;
  return mesh;
}

export function markTerrainAnchor<T extends THREE.Object3D>(object: T, offset = 0): T {
  object.userData[TERRAIN_ANCHOR_OFFSET] = offset;
  return object;
}

export function placeOnTerrain(
  object: THREE.Object3D,
  x: number,
  z: number,
  yaw: number,
  footprint: TerrainFootprint,
  options: TerrainPlacementOptions = {},
): void {
  const baseY = getTerrainHeight(x, z);
  object.position.set(x, baseY, z);
  object.quaternion.copy(buildTerrainQuaternion(x, z, yaw, footprint, options));
  object.position.y += getPlacementLift(x, z, baseY, object.quaternion, footprint, options) + (options.clearance ?? 0.02);
  object.updateMatrixWorld(true);
  syncTerrainSurfaces(object);
}

export function syncTerrainSurfaces(root: THREE.Object3D): void {
  root.traverse((child) => {
    syncTerrainAnchor(child);
    if (!(child instanceof THREE.Mesh)) return;
    const offset = child.userData[TERRAIN_SURFACE_OFFSET];
    if (typeof offset !== 'number') return;
    conformTerrainMesh(child, offset);
  });
}

function syncTerrainAnchor(child: THREE.Object3D): void {
  const offset = child.userData[TERRAIN_ANCHOR_OFFSET];
  if (typeof offset !== 'number') return;
  if (!child.parent) return;
  const source = getTerrainAnchorSource(child);
  const worldPoint = source.clone().applyMatrix4(child.parent.matrixWorld);
  worldPoint.y = getTerrainHeight(worldPoint.x, worldPoint.z) + offset;
  child.position.copy(child.parent.worldToLocal(worldPoint));
}

function getPlacementLift(
  x: number,
  z: number,
  baseY: number,
  quaternion: THREE.Quaternion,
  footprint: TerrainFootprint,
  options: TerrainPlacementOptions,
): number {
  if (options.useFooting === false) return 0;
  return getTerrainLift(x, z, baseY, quaternion, footprint);
}

function buildTerrainQuaternion(
  x: number,
  z: number,
  yaw: number,
  footprint: TerrainFootprint,
  options: TerrainPlacementOptions,
): THREE.Quaternion {
  if (!options.alignToSlope) return new THREE.Quaternion().setFromAxisAngle(UP_AXIS, yaw);
  return getTerrainAlignedQuaternion(x, z, yaw, getSampleRadius(footprint, options));
}

function getSampleRadius(footprint: TerrainFootprint, options: TerrainPlacementOptions): number {
  if (options.sampleRadius) return options.sampleRadius;
  return Math.max(0.6, Math.min(footprint.width, footprint.depth) * 0.5);
}

function getTerrainLift(
  x: number,
  z: number,
  baseY: number,
  quaternion: THREE.Quaternion,
  footprint: TerrainFootprint,
): number {
  let lift = 0;
  const halfWidth = footprint.width * 0.5;
  const halfDepth = footprint.depth * 0.5;
  const offset = new THREE.Vector3();
  for (const [sampleX, sampleZ] of FOOTING_SAMPLES) {
    offset.set(sampleX * halfWidth, 0, sampleZ * halfDepth).applyQuaternion(quaternion);
    const terrainY = getTerrainHeight(x + offset.x, z + offset.z);
    lift = Math.max(lift, terrainY - (baseY + offset.y));
  }
  return lift;
}

function conformTerrainMesh(mesh: THREE.Mesh, offset: number): void {
  const source = getTerrainSurfaceSource(mesh);
  const positions = getTerrainSurfacePositions(mesh);
  if (!positions) return;
  const geometry = mesh.geometry;
  const blend = getTerrainSurfaceBlend(mesh);
  const worldPoint = new THREE.Vector3();
  const inverse = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
  for (let index = 0; index < positions.count; index++) {
    const baseIndex = index * 3;
    worldPoint.set(source[baseIndex], source[baseIndex + 1], source[baseIndex + 2]).applyMatrix4(mesh.matrixWorld);
    const terrainY = getTerrainHeight(worldPoint.x, worldPoint.z) + offset;
    worldPoint.y += (terrainY - worldPoint.y) * blend;
    worldPoint.applyMatrix4(inverse);
    positions.setXYZ(index, worldPoint.x, worldPoint.y, worldPoint.z);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

function getTerrainSurfacePositions(mesh: THREE.Mesh): THREE.BufferAttribute | null {
  const positions = mesh.geometry.getAttribute('position');
  return positions instanceof THREE.BufferAttribute ? positions : null;
}

function getTerrainSurfaceSource(mesh: THREE.Mesh): Float32Array {
  const cached = mesh.userData[TERRAIN_SURFACE_SOURCE];
  if (cached instanceof Float32Array) return cached;
  mesh.geometry = mesh.geometry.clone();
  const cloned = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  const source = new Float32Array(cloned.array as ArrayLike<number>);
  mesh.userData[TERRAIN_SURFACE_SOURCE] = source;
  return source;
}

function getTerrainAnchorSource(child: THREE.Object3D): THREE.Vector3 {
  const cached = child.userData[TERRAIN_ANCHOR_SOURCE];
  if (cached instanceof THREE.Vector3) return cached;
  const source = child.position.clone();
  child.userData[TERRAIN_ANCHOR_SOURCE] = source;
  return source;
}

function getTerrainSurfaceBlend(mesh: THREE.Mesh): number {
  const blend = mesh.userData[TERRAIN_SURFACE_BLEND];
  if (typeof blend !== 'number') return 1;
  return Math.max(0, Math.min(1, blend));
}
