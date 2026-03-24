import * as THREE from 'three';

/**
 * Procedural normal and roughness map generator.
 *
 * Generates canvas-based maps that add perceived geometric detail
 * without increasing vertex count. Each generator uses Sobel-style
 * heightmap-to-normal conversion from a random noise canvas.
 */

const DEFAULT_SIZE = 256;

// ── Public API ──────────────────────────────────────────────

/** Generate a normal map from procedural noise (grass-like relief). */
export function buildGrassNormalMap(size = DEFAULT_SIZE): THREE.CanvasTexture {
  const heightCtx = createNoiseCanvas(size, 3);
  return heightToNormalMap(heightCtx, size, 1.5);
}

/** Generate a bark-like normal map (vertical ridges). */
export function buildBarkNormalMap(size = DEFAULT_SIZE): THREE.CanvasTexture {
  const heightCtx = createRidgeCanvas(size, 20);
  return heightToNormalMap(heightCtx, size, 2.0);
}

/** Generate a rough stone normal map. */
export function buildStoneNormalMap(size = DEFAULT_SIZE): THREE.CanvasTexture {
  const heightCtx = createNoiseCanvas(size, 8);
  return heightToNormalMap(heightCtx, size, 2.5);
}

/** Generate a roughness map from procedural noise. */
export function buildRoughnessMap(size = DEFAULT_SIZE, amplitude = 40): THREE.CanvasTexture {
  const ctx = createCanvas(size);
  fillGray(ctx, 180);
  addPixelNoise(ctx, size, amplitude);
  return configureTexture(ctx.canvas as HTMLCanvasElement);
}

// ── Heightmap generators ────────────────────────────────────

function createNoiseCanvas(size: number, blobSize: number): CanvasRenderingContext2D {
  const ctx = createCanvas(size);
  fillGray(ctx, 128);
  addBlobNoise(ctx, size, blobSize);
  addPixelNoise(ctx, size, 15);
  return ctx;
}

function createRidgeCanvas(size: number, ridgeCount: number): CanvasRenderingContext2D {
  const ctx = createCanvas(size);
  fillGray(ctx, 128);
  drawVerticalRidges(ctx, size, ridgeCount);
  addPixelNoise(ctx, size, 10);
  return ctx;
}

function drawVerticalRidges(ctx: CanvasRenderingContext2D, size: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const x = (i / count) * size + (Math.random() - 0.5) * (size / count) * 0.5;
    const width = 2 + Math.random() * 4;
    ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.15})`;
    ctx.fillRect(x, 0, width, size);
  }
}

// ── Heightmap → Normal map conversion ───────────────────────

function heightToNormalMap(heightCtx: CanvasRenderingContext2D, size: number, strength: number): THREE.CanvasTexture {
  const heightData = heightCtx.getImageData(0, 0, size, size).data;
  const outCtx = createCanvas(size);
  const outImg = outCtx.getImageData(0, 0, size, size);
  const out = outImg.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      writeNormalPixel(out, heightData, x, y, size, strength);
    }
  }

  outCtx.putImageData(outImg, 0, 0);
  return configureTexture(outCtx.canvas as HTMLCanvasElement);
}

function writeNormalPixel(
  out: Uint8ClampedArray,
  heightData: Uint8ClampedArray,
  x: number,
  y: number,
  size: number,
  strength: number,
): void {
  const idx = (y * size + x) * 4;
  const l = sampleHeight(heightData, x - 1, y, size);
  const r = sampleHeight(heightData, x + 1, y, size);
  const u = sampleHeight(heightData, x, y - 1, size);
  const d = sampleHeight(heightData, x, y + 1, size);

  const dx = (l - r) * strength;
  const dy = (u - d) * strength;
  const dz = 1.0;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

  out[idx] = ((dx / len) * 0.5 + 0.5) * 255;
  out[idx + 1] = ((dy / len) * 0.5 + 0.5) * 255;
  out[idx + 2] = ((dz / len) * 0.5 + 0.5) * 255;
  out[idx + 3] = 255;
}

function sampleHeight(data: Uint8ClampedArray, x: number, y: number, size: number): number {
  const cx = ((x % size) + size) % size;
  const cy = ((y % size) + size) % size;
  return data[(cy * size + cx) * 4] / 255;
}

// ── Canvas utilities ────────────────────────────────────────

function createCanvas(size: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas.getContext('2d')!;
}

function fillGray(ctx: CanvasRenderingContext2D, value: number): void {
  ctx.fillStyle = `rgb(${value},${value},${value})`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function addBlobNoise(ctx: CanvasRenderingContext2D, size: number, blobSize: number): void {
  for (let i = 0; i < size * 2; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = blobSize + Math.random() * blobSize;
    const brightness = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},0.08)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function addPixelNoise(ctx: CanvasRenderingContext2D, size: number, amplitude: number): void {
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * amplitude;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  ctx.putImageData(imageData, 0, 0);
}

function configureTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
