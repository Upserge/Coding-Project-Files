import * as THREE from 'three';

// ── Cached textures (generated once, shared by all characters) ──

let cachedMatcap: THREE.CanvasTexture | null = null;
let cachedGradient: THREE.CanvasTexture | null = null;

// ── Matcap ──────────────────────────────────────────────────

const MATCAP_SIZE = 256;

/** Soft warm-clay matcap with subtle rim highlight. Cached globally. */
export function getClayMatcap(): THREE.CanvasTexture {
  cachedMatcap ??= paintClayMatcap();
  return cachedMatcap;
}

function paintClayMatcap(): THREE.CanvasTexture {
  const canvas = createCanvas(MATCAP_SIZE, MATCAP_SIZE);
  const ctx = canvas.getContext('2d')!;
  const half = MATCAP_SIZE / 2;

  paintMatcapBase(ctx, half);
  paintMatcapRim(ctx, half);

  return toTexture(canvas);
}

function paintMatcapBase(ctx: CanvasRenderingContext2D, half: number): void {
  const grad = ctx.createRadialGradient(
    half * 0.62, half * 0.52, 0,
    half, half, half,
  );
  grad.addColorStop(0.0, '#faf6f0');
  grad.addColorStop(0.25, '#e0d8cc');
  grad.addColorStop(0.55, '#a89888');
  grad.addColorStop(0.80, '#605048');
  grad.addColorStop(1.0, '#352e28');

  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function paintMatcapRim(ctx: CanvasRenderingContext2D, half: number): void {
  const rim = ctx.createRadialGradient(
    half, half, half * 0.78,
    half, half, half,
  );
  rim.addColorStop(0.0, 'rgba(255,248,225,0)');
  rim.addColorStop(0.55, 'rgba(255,248,225,0)');
  rim.addColorStop(0.82, 'rgba(255,248,225,0.22)');
  rim.addColorStop(1.0, 'rgba(255,248,225,0)');

  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.fillStyle = rim;
  ctx.fill();
}

// ── Body gradient ───────────────────────────────────────────

const GRADIENT_HEIGHT = 64;

/** Neutral vertical gradient (white→warm-gray) for body depth. Cached globally. */
export function getBodyGradient(): THREE.CanvasTexture {
  cachedGradient ??= paintBodyGradient();
  return cachedGradient;
}

function paintBodyGradient(): THREE.CanvasTexture {
  const canvas = createCanvas(1, GRADIENT_HEIGHT);
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, GRADIENT_HEIGHT);
  grad.addColorStop(0.0, '#ffffff');
  grad.addColorStop(0.45, '#f2eee8');
  grad.addColorStop(1.0, '#d8d0c8');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, GRADIENT_HEIGHT);

  return toTexture(canvas);
}

// ── Helpers ─────────────────────────────────────────────────

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
