import * as THREE from 'three';
import { buildGrassNormalMap, buildRoughnessMap } from './procedural-normal.builder';

/**
 * Seamless procedural ground material.
 *
 * Strategy:
 *  1. Large 2048px canvas with edge-wrapped patches → no visible seam.
 *  2. Low tile repeat (4×4) so the pattern reads as organic, not grid.
 *  3. A second detail-noise texture at higher repeat breaks micro-repetition.
 *  4. `onBeforeCompile` injects a shader snippet that blends both textures.
 */

const TEX_SIZE = 2048;
const DETAIL_SIZE = 256;

const BASE_COLOR = '#6f855d';
const DARK_PATCH = '#647856';
const LIGHT_PATCH = '#7a9166';
const DIRT_PATCH = '#786651';
const MUD_PATCH = '#665847';

// ── Public API ──────────────────────────────────────────────

/** Build a seamless ground material with shader-blended detail noise. */
export function buildGroundMaterial(): THREE.MeshStandardMaterial {
  const colorMap = createColorMap();
  const detailMap = createDetailMap();
  const normalMap = createGroundNormalMap();
  const roughnessMap = createGroundRoughnessMap();
  const material = createBaseMaterial(colorMap, normalMap, roughnessMap);
  injectDetailShader(material, detailMap);
  return material;
}

// ── Color map (large, seamless) ─────────────────────────────

function createColorMap(): THREE.CanvasTexture {
  const ctx = createCanvas(TEX_SIZE);
  fillBase(ctx);
  paintWrappedPatches(ctx, DARK_PATCH, 75, 36, 84, 0.08);
  paintWrappedPatches(ctx, LIGHT_PATCH, 55, 28, 72, 0.07);
  paintWrappedPatches(ctx, DIRT_PATCH, 30, 18, 42, 0.08);
  paintWrappedPatches(ctx, MUD_PATCH, 16, 14, 28, 0.07);
  paintNoise(ctx, 7);
  return configureTexture(ctx.canvas as HTMLCanvasElement, 4);
}

// ── Detail noise map ────────────────────────────────────────

function createDetailMap(): THREE.CanvasTexture {
  const ctx = createCanvas(DETAIL_SIZE);
  fillGray(ctx);
  paintNoise(ctx, 30);
  return configureTexture(ctx.canvas as HTMLCanvasElement, 40);
}

// ── Normal + roughness maps ─────────────────────────────────

function createGroundNormalMap(): THREE.CanvasTexture {
  const normal = buildGrassNormalMap(512);
  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(12, 12);
  return normal;
}

function createGroundRoughnessMap(): THREE.CanvasTexture {
  const rough = buildRoughnessMap(256, 35);
  rough.wrapS = THREE.RepeatWrapping;
  rough.wrapT = THREE.RepeatWrapping;
  rough.repeat.set(8, 8);
  return rough;
}

// ── Material creation ───────────────────────────────────────

function createBaseMaterial(
  colorMap: THREE.CanvasTexture,
  normalMap: THREE.CanvasTexture,
  roughnessMap: THREE.CanvasTexture,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughnessMap,
    roughness: 0.92,
    metalness: 0,
    vertexColors: true,
  });
}

// ── Shader injection ────────────────────────────────────────

function injectDetailShader(mat: THREE.MeshStandardMaterial, detailMap: THREE.CanvasTexture): void {
  mat.userData['detailMap'] = detailMap;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms['detailMap'] = { value: detailMap };
    shader.fragmentShader = addDetailUniforms(shader.fragmentShader);
    shader.fragmentShader = addDetailBlend(shader.fragmentShader);
  };
}

function addDetailUniforms(frag: string): string {
  return frag.replace(
    '#include <common>',
    'uniform sampler2D detailMap;\n#include <common>',
  );
}

function addDetailBlend(frag: string): string {
  return frag.replace(
    '#include <map_fragment>',
    `#include <map_fragment>
     vec4 detail = texture2D(detailMap, vMapUv * 10.0);
     diffuseColor.rgb *= 0.9 + detail.r * 0.18;`,
  );
}

// ── Canvas helpers ──────────────────────────────────────────

function createCanvas(size: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas.getContext('2d')!;
}

function fillBase(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = BASE_COLOR;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function fillGray(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function configureTexture(canvas: HTMLCanvasElement, repeat: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── Edge-wrapped patches (eliminates seams) ─────────────────

function paintWrappedPatches(
  ctx: CanvasRenderingContext2D,
  color: string,
  count: number,
  minR: number,
  maxR: number,
  alpha: number,
): void {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  const size = ctx.canvas.width;
  for (let i = 0; i < count; i++) {
    drawWrappedEllipse(ctx, size, minR, maxR);
  }
  ctx.globalAlpha = 1;
}

function drawWrappedEllipse(
  ctx: CanvasRenderingContext2D,
  size: number,
  minR: number,
  maxR: number,
): void {
  const x = Math.random() * size;
  const y = Math.random() * size;
  const r = minR + Math.random() * (maxR - minR);
  const angle = Math.random() * Math.PI;
  const offsets = [0, -size, size];
  for (const ox of offsets) {
    for (const oy of offsets) {
      ctx.beginPath();
      ctx.ellipse(x + ox, y + oy, r, r * 0.7, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Pixel noise ─────────────────────────────────────────────

function paintNoise(ctx: CanvasRenderingContext2D, amplitude: number): void {
  const size = ctx.canvas.width;
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
