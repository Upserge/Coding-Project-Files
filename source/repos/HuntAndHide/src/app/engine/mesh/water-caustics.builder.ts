import * as THREE from 'three';

/**
 * Animated water caustic planes placed above water features.
 *
 * A canvas-generated Voronoi-like caustic texture scrolls over a
 * transparent plane with additive blending to simulate underwater
 * light patterns on the ground near ponds/streams.
 *
 * Call `buildCausticPlane` per water feature, then `tickCaustics`
 * each frame.
 */

const causticMaterials: THREE.MeshBasicMaterial[] = [];

// ── Public API ──────────────────────────────────────────────

/** Create a caustic overlay for a circular water feature (pond). */
export function buildPondCaustics(radius: number): THREE.Mesh {
  const geo = new THREE.CircleGeometry(radius * 0.9, 24);
  const mat = createCausticMaterial();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.06;
  mesh.renderOrder = 1;
  return mesh;
}

/** Create a caustic overlay for a rectangular water feature (stream). */
export function buildStreamCaustics(length: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(1.6, length * 0.9, 1, 1);
  const mat = createCausticMaterial();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.06;
  mesh.renderOrder = 1;
  return mesh;
}

/** Advance caustic animation — call once per frame. */
export function tickCaustics(elapsed: number): void {
  for (const mat of causticMaterials) {
    if (mat.map) {
      mat.map.offset.x = elapsed * 0.02;
      mat.map.offset.y = elapsed * 0.015;
    }
    mat.opacity = 0.12 + Math.sin(elapsed * 1.2) * 0.04;
  }
}

// ── Material ────────────────────────────────────────────────

function createCausticMaterial(): THREE.MeshBasicMaterial {
  const texture = getCausticTexture();
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  causticMaterials.push(mat);
  return mat;
}

// ── Caustic texture (canvas) ────────────────────────────────

let sharedCausticTexture: THREE.CanvasTexture | null = null;

function getCausticTexture(): THREE.CanvasTexture {
  if (!sharedCausticTexture) {
    sharedCausticTexture = generateCausticTexture(256);
    sharedCausticTexture.wrapS = THREE.RepeatWrapping;
    sharedCausticTexture.wrapT = THREE.RepeatWrapping;
    sharedCausticTexture.repeat.set(2, 2);
  }
  return sharedCausticTexture;
}

/**
 * Generate a Voronoi-like caustic pattern on canvas.
 * Uses a grid of random points + distance field to approximate
 * the bright network lines of underwater light caustics.
 */
function generateCausticTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Random point grid for Voronoi cells
  const cellCount = 8;
  const cellSize = size / cellCount;
  const points: [number, number][] = [];
  for (let cy = 0; cy < cellCount; cy++) {
    for (let cx = 0; cx < cellCount; cx++) {
      points.push([
        (cx + 0.2 + Math.random() * 0.6) * cellSize,
        (cy + 0.2 + Math.random() * 0.6) * cellSize,
      ]);
    }
  }

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Find two closest points (tileable wrapping)
      let d1 = Infinity;
      let d2 = Infinity;
      for (const [px, py] of points) {
        for (const ox of [-size, 0, size]) {
          for (const oy of [-size, 0, size]) {
            const dx = x - (px + ox);
            const dy = y - (py + oy);
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < d1) { d2 = d1; d1 = d; }
            else if (d < d2) { d2 = d; }
          }
        }
      }

      // Edge brightness: bright where d2 - d1 is small (cell boundaries)
      const edge = 1 - Math.min(1, (d2 - d1) / (cellSize * 0.4));
      const brightness = Math.pow(edge, 2.5) * 255;

      const idx = (y * size + x) * 4;
      data[idx]     = brightness * 0.8;
      data[idx + 1] = brightness;
      data[idx + 2] = brightness;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}
