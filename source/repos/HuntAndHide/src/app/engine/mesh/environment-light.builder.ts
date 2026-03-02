import * as THREE from 'three';

/**
 * Procedural environment lighting (IBL) builder.
 *
 * Generates a simple CubeTexture from six canvas faces that simulate
 * a warm jungle sky + ground bounce. When set as `scene.environment`,
 * all MeshStandardMaterial objects receive realistic ambient reflections
 * instead of flat ambient light alone.
 */

const FACE_SIZE = 128;

/** Sky gradient stops. */
const SKY_TOP = '#6ec6e6';
const SKY_HORIZON = '#b8e0c8';
const GROUND_BOUNCE = '#2d6a4f';

// ── Public API ──────────────────────────────────────────────

/** Build a procedural CubeTexture for environment reflections. */
export function buildEnvironmentMap(): THREE.CubeTexture {
  const faces = generateFaces();
  const tex = new THREE.CubeTexture(faces);
  tex.needsUpdate = true;
  return tex;
}

// ── Face generation ─────────────────────────────────────────

function generateFaces(): HTMLCanvasElement[] {
  return [
    createSkyFace(),   // +X
    createSkyFace(),   // -X
    createTopFace(),   // +Y (sky above)
    createGroundFace(),// -Y (ground below)
    createSkyFace(),   // +Z
    createSkyFace(),   // -Z
  ];
}

function createSkyFace(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas();
  const gradient = ctx.createLinearGradient(0, 0, 0, FACE_SIZE);
  gradient.addColorStop(0, SKY_TOP);
  gradient.addColorStop(1, SKY_HORIZON);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
  addSoftNoise(ctx);
  return canvas;
}

function createTopFace(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas();
  ctx.fillStyle = SKY_TOP;
  ctx.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
  addSoftNoise(ctx);
  return canvas;
}

function createGroundFace(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas();
  ctx.fillStyle = GROUND_BOUNCE;
  ctx.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
  addSoftNoise(ctx);
  return canvas;
}

// ── Canvas helpers ──────────────────────────────────────────

function makeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = FACE_SIZE;
  canvas.height = FACE_SIZE;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function addSoftNoise(ctx: CanvasRenderingContext2D): void {
  const imgData = ctx.getImageData(0, 0, FACE_SIZE, FACE_SIZE);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 6;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  ctx.putImageData(imgData, 0, 0);
}
