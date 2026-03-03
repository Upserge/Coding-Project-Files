import * as THREE from 'three';

/**
 * Build mesh-based volumetric god-ray shafts.
 *
 * Each shaft is a pair of perpendicular PlaneGeometry quads with a
 * soft vertical-gradient canvas texture — giving a cross-hatch
 * volumetric look from any camera angle. A slow breathing animation
 * modulates opacity via `tickGodRays`.
 *
 * Sun direction assumed at (60, 100, 40).
 */

const RAY_COUNT = 5;
const RAY_COLOR = 0xfff8e1;

/** Module-level material refs for breathing animation. */
const rayMaterials: THREE.MeshBasicMaterial[] = [];

// ── Public API ──────────────────────────────────────────────

export function buildGodRays(): THREE.Group {
  rayMaterials.length = 0;
  const group = new THREE.Group();
  const texture = createRayTexture();

  for (let i = 0; i < RAY_COUNT; i++) {
    const shaft = createShaft(i, texture);
    group.add(shaft);
  }

  group.renderOrder = 5;
  return group;
}

/** Advance breathing animation — call once per frame. */
export function tickGodRays(elapsed: number): void {
  for (let i = 0; i < rayMaterials.length; i++) {
    const base = 0.045 + i * 0.008;
    rayMaterials[i].opacity = base + Math.sin(elapsed * 0.4 + i * 1.2) * 0.02;
  }
}

// ── Gradient texture ────────────────────────────────────────

function createRayTexture(): THREE.CanvasTexture {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Vertical gradient: bright at top → transparent at bottom
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255,248,225,0.7)');
  grad.addColorStop(0.3, 'rgba(255,248,225,0.35)');
  grad.addColorStop(0.7, 'rgba(255,248,225,0.08)');
  grad.addColorStop(1, 'rgba(255,248,225,0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft horizontal fade — mask the hard left/right edges
  ctx.globalCompositeOperation = 'destination-in';
  const hGrad = ctx.createLinearGradient(0, 0, w, 0);
  hGrad.addColorStop(0, 'rgba(255,255,255,0)');
  hGrad.addColorStop(0.25, 'rgba(255,255,255,1)');
  hGrad.addColorStop(0.75, 'rgba(255,255,255,1)');
  hGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// ── Individual shaft (cross-hatch pair) ─────────────────────

/** Shaft configs: [x, z, width, height, tiltX, tiltZ] */
const SHAFT_CONFIGS: [number, number, number, number, number, number][] = [
  [-10, -8, 4.0, 22, 0.20, -0.10],
  [  2,  3, 5.0, 26, 0.15,  0.05],
  [ 15, -3, 3.5, 20, 0.25, -0.08],
  [ -3, 12, 4.5, 24, 0.18,  0.12],
];

function createShaft(index: number, texture: THREE.CanvasTexture): THREE.Group {
  const [x, z, width, height, tiltX, tiltZ] = SHAFT_CONFIGS[index];
  const group = new THREE.Group();

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    color: RAY_COLOR,
    transparent: true,
    opacity: 0.045 + index * 0.008,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  rayMaterials.push(mat);

  // Two perpendicular planes create cross-hatch volume
  const geo = new THREE.PlaneGeometry(width, height);

  const planeA = new THREE.Mesh(geo, mat);
  planeA.renderOrder = 5;
  group.add(planeA);

  const planeB = new THREE.Mesh(geo, mat);
  planeB.rotation.y = Math.PI / 2;
  planeB.renderOrder = 5;
  group.add(planeB);

  // Position: shaft hangs from the sky, anchored at its vertical center
  group.position.set(x, height / 2 - 2, z);
  group.rotation.x = tiltX;
  group.rotation.z = tiltZ;

  return group;
}
