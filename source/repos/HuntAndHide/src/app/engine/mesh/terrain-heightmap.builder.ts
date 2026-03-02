import * as THREE from 'three';

/**
 * Terrain heightmap using layered sinusoidal noise.
 *
 * Provides:
 *  - `getTerrainHeight(x, z)` — world-space height at any XZ coordinate
 *  - `applyHeightmap(geo, width, depth)` — displaces PlaneGeometry vertices
 *
 * The PlaneGeometry must be in its default XY orientation
 * (pre-rotation). After the mesh is rotated −90° on X, the displaced
 * Z vertices become world Y.
 */

// ── Height function ─────────────────────────────────────────

/** Return the terrain height at a given world XZ coordinate. */
export function getTerrainHeight(x: number, z: number): number {
  return (
    Math.sin(x * 0.04) * Math.cos(z * 0.03) * 0.7 +
    Math.sin(x * 0.1 + z * 0.07) * 0.25 +
    Math.cos(x * 0.02 - z * 0.05) * 0.5
  );
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

  for (let i = 0; i < pos.count; i++) {
    const localX = pos.getX(i);
    const localY = pos.getY(i);
    const worldZ = -localY;
    pos.setZ(i, getTerrainHeight(localX, worldZ));
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
}
