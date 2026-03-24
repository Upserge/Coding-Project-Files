import * as THREE from 'three';
import { getTerrainHeight } from './terrain-heightmap.builder';

/**
 * Instanced grass builder.
 *
 * Replaces hundreds of individual grass Group/Mesh objects with a
 * single `InstancedMesh` — one draw call for the entire grass layer.
 *
 * Each instance is a tapered blade with:
 *   - Random position, rotation, and scale
 *   - Per-instance vertex-color variation (dark→light green)
 *   - GPU-driven wind sway via `onBeforeCompile` vertex shader
 *
 * Call `tickInstancedGrass` every frame to advance the wind uniform.
 */

const BLADE_COUNT = 2000;
const SPREAD_MARGIN = 10; // keep blades away from map edges

// ── Public API ──────────────────────────────────────────────

/** Build instanced grass for the given map dimensions. */
export function buildInstancedGrass(
  mapWidth: number,
  mapDepth: number,
): THREE.InstancedMesh {
  const geo = createBladeGeometry();
  const mat = createGrassMaterial();
  const mesh = new THREE.InstancedMesh(geo, mat, BLADE_COUNT);

  populateInstances(mesh, mapWidth, mapDepth);
  injectWindShader(mat, mesh);

  mesh.frustumCulled = false;
  return mesh;
}

/** Advance the wind animation uniform. */
export function tickInstancedGrass(
  mesh: THREE.InstancedMesh,
  elapsed: number,
): void {
  const u = mesh.userData['windTime'] as { value: number } | undefined;
  if (u) u.value = elapsed;
}

// ── Blade geometry ──────────────────────────────────────────

function createBladeGeometry(): THREE.ShapeGeometry {
  const w = 0.12;
  const h = 0.6;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(w * 0.1, h);
  shape.lineTo(-w * 0.1, h);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

// ── Material ────────────────────────────────────────────────

function createGrassMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    roughness: 0.85,
    depthWrite: false,
  });
}

// ── Instance population ─────────────────────────────────────

function populateInstances(
  mesh: THREE.InstancedMesh,
  mapWidth: number,
  mapDepth: number,
): void {
  const halfW = mapWidth / 2 - SPREAD_MARGIN;
  const halfD = mapDepth / 2 - SPREAD_MARGIN;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const palette = [
    new THREE.Color(0xc8b560), // light yellow-brown
    new THREE.Color(0xa4b74e), // olive-yellow
    new THREE.Color(0x6fbf3b), // bright lime green
    new THREE.Color(0x4caf50), // medium green
    new THREE.Color(0x2e7d32), // deep green
  ];

  for (let i = 0; i < BLADE_COUNT; i++) {
    const x = (Math.random() - 0.5) * halfW * 2;
    const z = (Math.random() - 0.5) * halfD * 2;

    dummy.position.set(x, getTerrainHeight(x, z), z);
    dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.15);
    const s = 0.8 + Math.random() * 0.6;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    const t = Math.random() * (palette.length - 1);
    const idx = Math.floor(t);
    color.lerpColors(palette[idx], palette[Math.min(idx + 1, palette.length - 1)], t - idx);
    mesh.setColorAt(i, color);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

// ── Wind shader injection ───────────────────────────────────

function injectWindShader(
  mat: THREE.MeshStandardMaterial,
  mesh: THREE.InstancedMesh,
): void {
  const timeUniform = { value: 0 };
  mesh.userData['windTime'] = timeUniform;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms['uTime'] = timeUniform;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      'uniform float uTime;\n#include <common>',
    );

    // Sway increases with blade height; phase varies per-instance world position
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float windStrength = position.y * 0.25;
       float phase = instanceMatrix[3][0] * 0.1 + instanceMatrix[3][2] * 0.1;
       transformed.x += sin(uTime * 1.5 + phase) * windStrength;`,
    );
  };
}
