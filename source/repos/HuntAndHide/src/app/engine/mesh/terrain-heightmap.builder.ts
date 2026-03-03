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
// Valley (low) → dark, cool-tinted; Ridge (high) → bright, warm-tinted.
// These are vertex-color multipliers applied to the ground texture.
const VALLEY_R = 0.50, VALLEY_G = 0.60, VALLEY_B = 0.70;
const RIDGE_R  = 1.00, RIDGE_G  = 0.97, RIDGE_B  = 0.82;

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

  // Pass 2 — height + slope based vertex colors
  const range = maxH - minH || 1;
  const normals = geo.getAttribute('normal') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getZ(i) - minH) / range;
    // Ease-out: only deep valleys darken noticeably; mid & high stay bright
    const ht = 1 - (1 - t) * (1 - t);

    let r = VALLEY_R + (RIDGE_R - VALLEY_R) * ht;
    let g = VALLEY_G + (RIDGE_G - VALLEY_G) * ht;
    let b = VALLEY_B + (RIDGE_B - VALLEY_B) * ht;

    // Darken steep slopes slightly (exposed earth feel)
    const nz = normals.getZ(i);
    const slope = 0.88 + 0.12 * nz * nz;
    r *= slope;
    g *= slope;
    b *= slope;

    colors[i * 3]     = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
