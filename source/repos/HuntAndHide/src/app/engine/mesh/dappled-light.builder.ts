import * as THREE from 'three';

/**
 * Dappled light builder — a large ground-level plane with a
 * procedural canopy shadow pattern.
 *
 * Simulates the look of sunlight filtering through dense foliage
 * by overlaying dark shadow blobs with alpha-based NormalBlending.
 * One draw call, no per-frame cost (static texture).
 */

const PLANE_SIZE = 200;

// ── Public API ──────────────────────────────────────────────

export function buildDappledLight(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE);
  const texture = createDappleTexture(512);

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.MultiplyBlending,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.12;
  mesh.renderOrder = 1;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

// ── Canvas texture ──────────────────────────────────────────

/**
 * Generate a canopy-shadow cookie for NormalBlending: dark shadow blobs
 * on a transparent base. The alpha channel controls where shadows appear,
 * while the RGB is kept dark green to match canopy shade.
 */
function createDappleTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // White base — for MultiplyBlending white = no effect (neutral)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Soft canopy shadow blobs — bright RGB so MultiplyBlending
  // gently darkens rather than crushing to black.
  // rgb(180,195,170) ≈ 0.72 multiplier → ~28 % shadow.
  const blobCount = 36;
  for (let i = 0; i < blobCount; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const rx = 40 + Math.random() * 80;
    const ry = 32 + Math.random() * 64;
    const rot = Math.random() * Math.PI;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0, 'rgba(208, 216, 200, 0.14)');
    grad.addColorStop(0.45, 'rgba(220, 226, 212, 0.1)');
    grad.addColorStop(0.82, 'rgba(236, 239, 230, 0.04)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.6, 1.6);
  return tex;
}
