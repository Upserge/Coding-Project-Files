import * as THREE from 'three';
import { getClayMatcap, getBodyGradient } from './canvas-texture.builder';

// ── Part-kind presets for MeshStandardMaterial ──────────────

type PartKind = 'glossy' | 'matte' | 'hard';

const PART_CONFIGS: Record<PartKind, { roughness: number; metalness: number }> = {
  glossy: { roughness: 0.12, metalness: 0.05 },
  matte:  { roughness: 0.85, metalness: 0.0 },
  hard:   { roughness: 0.30, metalness: 0.05 },
};

// ── Factory functions ───────────────────────────────────────

/** Matcap body material — clay shading + top-to-bottom gradient depth. */
export function createBodyMatcap(color: number): THREE.MeshMatcapMaterial {
  return new THREE.MeshMatcapMaterial({
    color,
    matcap: getClayMatcap(),
    map: getBodyGradient(),
  });
}

/** Matcap surface material — clay shading, no gradient (belly/limbs/ears). */
export function createSurfaceMatcap(color: number): THREE.MeshMatcapMaterial {
  return new THREE.MeshMatcapMaterial({
    color,
    matcap: getClayMatcap(),
  });
}

/** Standard material with per-kind roughness/metalness (eyes, nose, accents). */
export function createStandardPart(color: number, kind: PartKind): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, ...PART_CONFIGS[kind] });
}
