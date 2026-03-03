import * as THREE from 'three';
import { getTerrainHeight } from './terrain-heightmap.builder';

/**
 * Contact shadow decals — soft dark ellipses under dynamic entities.
 *
 * Uses a single InstancedMesh with a radial-gradient canvas texture
 * and multiply blending. Grounds players/items visually even if
 * real-time shadow maps have aliasing or are too far from the camera.
 *
 * Call `buildContactShadows()` once, then `updateContactShadows()`
 * each frame with current entity positions.
 */

const MAX_SHADOWS = 32;
const SHADOW_RADIUS = 0.7;

let shadowMesh: THREE.InstancedMesh | null = null;
const dummy = new THREE.Object3D();

// ── Public API ──────────────────────────────────────────────

/** Create the instanced shadow plane and add to scene. */
export function buildContactShadows(scene: THREE.Scene): THREE.InstancedMesh {
  shadowMesh = null;
  const geo = new THREE.PlaneGeometry(SHADOW_RADIUS * 2, SHADOW_RADIUS * 2);
  const mat = new THREE.MeshBasicMaterial({
    map: createShadowTexture(),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });

  shadowMesh = new THREE.InstancedMesh(geo, mat, MAX_SHADOWS);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.renderOrder = 0;
  shadowMesh.count = 0;
  scene.add(shadowMesh);
  return shadowMesh;
}

/**
 * Update contact shadow positions from a list of world-space XZ positions.
 * Each entry: `{ x, z, scale? }`. Scale defaults to 1.
 */
export function updateContactShadows(
  positions: { x: number; z: number; scale?: number }[],
): void {
  if (!shadowMesh) return;

  const count = Math.min(positions.length, MAX_SHADOWS);
  shadowMesh.count = count;

  for (let i = 0; i < count; i++) {
    const p = positions[i];
    const terrainY = getTerrainHeight(p.x, p.z);
    const s = p.scale ?? 1;
    dummy.position.set(p.x, terrainY + 0.04, p.z);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();

    // InstancedMesh is already rotated -90° on X, so we
    // transform positions into its local space via inverse rotation.
    // Simpler: set matrix directly accounting for parent rotation.
    const m = new THREE.Matrix4();
    // Undo parent X rotation for positioning: swap Y/Z
    m.compose(
      new THREE.Vector3(p.x, p.z, -(terrainY + 0.04)),
      new THREE.Quaternion(),
      new THREE.Vector3(s, s, s),
    );
    shadowMesh.setMatrixAt(i, m);
  }

  shadowMesh.instanceMatrix.needsUpdate = true;
}

// ── Shadow texture ──────────────────────────────────────────

function createShadowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}
