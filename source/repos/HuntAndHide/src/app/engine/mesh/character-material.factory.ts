import * as THREE from 'three';
import { getClayMatcap, getBodyGradient } from './canvas-texture.builder';

// ── Part-kind presets for MeshStandardMaterial ──────────────

type PartKind = 'glossy' | 'matte' | 'hard';

const PART_CONFIGS: Record<PartKind, { roughness: number; metalness: number }> = {
  glossy: { roughness: 0.12, metalness: 0.05 },
  matte:  { roughness: 0.85, metalness: 0.0 },
  hard:   { roughness: 0.30, metalness: 0.05 },
};

// ── Caches (keyed by color or color|kind) ──────────────────

const bodyMatcapCache = new Map<number, THREE.MeshMatcapMaterial>();
const surfaceMatcapCache = new Map<number, THREE.MeshMatcapMaterial>();
const standardPartCache = new Map<string, THREE.MeshStandardMaterial>();

// ── Factory functions ───────────────────────────────────────

/** Matcap body material — clay shading + top-to-bottom gradient depth. Cached per colour. */
export function createBodyMatcap(color: number): THREE.MeshMatcapMaterial {
  let mat = bodyMatcapCache.get(color);
  if (!mat) {
    mat = new THREE.MeshMatcapMaterial({ color, matcap: getClayMatcap(), map: getBodyGradient() });
    bodyMatcapCache.set(color, mat);
  }
  return mat;
}

/** Matcap surface material — clay shading, no gradient. Cached per colour. */
export function createSurfaceMatcap(color: number): THREE.MeshMatcapMaterial {
  let mat = surfaceMatcapCache.get(color);
  if (!mat) {
    mat = new THREE.MeshMatcapMaterial({ color, matcap: getClayMatcap() });
    surfaceMatcapCache.set(color, mat);
  }
  return mat;
}

/** Standard material with per-kind roughness/metalness. Cached per colour+kind. */
export function createStandardPart(color: number, kind: PartKind): THREE.MeshStandardMaterial {
  const key = `${color}|${kind}`;
  let mat = standardPartCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({ color, ...PART_CONFIGS[kind] });
    standardPartCache.set(key, mat);
  }
  return mat;
}
