import * as THREE from 'three';
import {
  getCausticSurfaceSize,
  STREAM_SURFACE_WIDTH,
  WATER_CAUSTIC_OFFSET,
  WATER_SURFACE_OFFSET,
} from '../../models/water-feature.model';
import { markTerrainSurface } from './terrain-placement';

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
let causticResetDone = false;
const POND_CAUSTIC_SEGMENTS = 64;
const STREAM_CAUSTIC_WIDTH_SEGMENTS = 10;
const STREAM_CAUSTIC_LENGTH_SEGMENTS = 64;
const POND_CAUSTIC_MASK_SIZE = 128;
const POND_CAUSTIC_OPACITY = 0.32;
const STREAM_CAUSTIC_OPACITY = 0.16;

/** Clear stale material refs from previous scene build. */
function resetCausticMaterials(): void {
  if (!causticResetDone) {
    for (const mat of causticMaterials) {
      mat.map?.dispose();
      mat.dispose();
    }
    causticMaterials.length = 0;
    sharedCausticTexture = null;
    causticResetDone = true;
    // Reset flag after microtask so subsequent calls in the same build cycle don't re-clear
    queueMicrotask(() => { causticResetDone = false; });
  }
}

// ── Public API ──────────────────────────────────────────────

/** Create a caustic overlay for a circular water feature (pond). */
export function buildPondCaustics(radius: number): THREE.Mesh {
  resetCausticMaterials();
  const surface = getCausticSurfaceSize(createWaterSizeSample('pond', radius));
  const geo = new THREE.PlaneGeometry(surface.width, surface.length, POND_CAUSTIC_SEGMENTS, POND_CAUSTIC_SEGMENTS);
  const mat = createCausticMaterial(surface.width, surface.length, POND_CAUSTIC_OPACITY);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WATER_CAUSTIC_OFFSET;
  mesh.renderOrder = 6;
  mat.alphaMap = getPondCausticMask();
  mat.alphaTest = 0.02;
  return markTerrainSurface(mesh, WATER_CAUSTIC_OFFSET);
}

/** Create a caustic overlay for a rectangular water feature (stream). */
export function buildStreamCaustics(length: number): THREE.Mesh {
  resetCausticMaterials();
  const surface = getCausticSurfaceSize(createWaterSizeSample('stream', length));
  const geo = new THREE.PlaneGeometry(surface.width, surface.length, STREAM_CAUSTIC_WIDTH_SEGMENTS, STREAM_CAUSTIC_LENGTH_SEGMENTS);
  const mat = createCausticMaterial(surface.width, surface.length, STREAM_CAUSTIC_OPACITY);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = WATER_CAUSTIC_OFFSET;
  mesh.renderOrder = 6;
  mesh.userData['terrainSurfaceBlend'] = getStreamCausticBlend();
  return markTerrainSurface(mesh, WATER_CAUSTIC_OFFSET);
}

/** Advance caustic animation — call once per frame. */
export function tickCaustics(elapsed: number): void {
  for (const mat of causticMaterials) {
    if (mat.map) {
      mat.map.offset.x = elapsed * 0.02;
      mat.map.offset.y = elapsed * 0.015;
    }
    const baseOpacity = mat.userData['baseOpacity'] as number | undefined;
    mat.opacity = (baseOpacity ?? 0.14) + Math.sin(elapsed * 1.2) * 0.035;
  }
}

// ── Material ────────────────────────────────────────────────

function createCausticMaterial(width: number, length: number, opacity: number): THREE.MeshBasicMaterial {
  const texture = createCausticTexture(width, length);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  mat.userData['baseOpacity'] = opacity;
  causticMaterials.push(mat);
  return mat;
}

function getStreamCausticBlend(): number {
  return 1;
}

function createWaterSizeSample(type: 'pond' | 'stream', size: number) {
  return {
    id: `caustic-${type}`,
    type,
    size,
    position: { x: 0, y: 0, z: 0 },
    rotationY: 0,
  };
}

// ── Caustic texture (canvas) ────────────────────────────────

let sharedCausticTexture: THREE.CanvasTexture | null = null;
let pondCausticMask: THREE.CanvasTexture | null = null;

function getCausticTexture(): THREE.CanvasTexture {
  if (!sharedCausticTexture) {
    sharedCausticTexture = generateCausticTexture(256);
    sharedCausticTexture.wrapS = THREE.RepeatWrapping;
    sharedCausticTexture.wrapT = THREE.RepeatWrapping;
  }
  return sharedCausticTexture;
}

function getPondCausticMask(): THREE.CanvasTexture {
  if (pondCausticMask) return pondCausticMask;
  const canvas = document.createElement('canvas');
  canvas.width = POND_CAUSTIC_MASK_SIZE;
  canvas.height = POND_CAUSTIC_MASK_SIZE;
  const ctx = canvas.getContext('2d')!;
  const half = POND_CAUSTIC_MASK_SIZE * 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.fill();
  pondCausticMask = new THREE.CanvasTexture(canvas);
  return pondCausticMask;
}

function createCausticTexture(width: number, length: number): THREE.CanvasTexture {
  const texture = getCausticTexture().clone();
  texture.needsUpdate = true;
  texture.repeat.set(
    Math.max(1, width / 1.5),
    Math.max(1, length / 3),
  );
  return texture;
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
