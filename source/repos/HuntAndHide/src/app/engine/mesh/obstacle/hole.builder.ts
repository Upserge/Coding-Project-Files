import * as THREE from 'three';
import { markTerrainAnchor, markTerrainSurface } from '../terrain-placement';

/** Palette for ground holes. */
const HOLE_COLOR = 0x3e2723;
const RIM_COLOR = 0x5d4037;
const DIRT_COLOR = 0x795548;
const GRASS_TUFT = 0x4a7a3a;
const ROOT_COLOR = 0x4e342e;
const HOLE_RADIUS = 0.9;
const HOLE_SURFACE_SEGMENTS = 36;
const HOLE_SURFACE_OFFSET = 0.014;
const HOLE_RIM_OFFSET = 0.048;
const HOLE_DETAIL_OFFSET = 0.055;
const HOLE_TEX_SIZE = 128;

// ── Cached geometries & materials (shared across all hole instances) ──

let _discGeo: THREE.PlaneGeometry | null = null;
let _discMat: THREE.MeshStandardMaterial | null = null;
function getDiscGeo(): THREE.PlaneGeometry {
  return _discGeo ??= new THREE.PlaneGeometry(HOLE_RADIUS * 2, HOLE_RADIUS * 2, HOLE_SURFACE_SEGMENTS, HOLE_SURFACE_SEGMENTS);
}

function getDiscMat(): THREE.MeshStandardMaterial {
  return _discMat ??= new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: getHoleSurfaceTexture(),
    alphaMap: getHoleCircleMask(),
    transparent: true,
    alphaTest: 0.08,
    roughness: 1,
    metalness: 0,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

let _rimGeo: THREE.PlaneGeometry | null = null;
let _rimMat: THREE.MeshStandardMaterial | null = null;
function getRimGeo(): THREE.PlaneGeometry {
  return _rimGeo ??= new THREE.PlaneGeometry(HOLE_RADIUS * 2.35, HOLE_RADIUS * 2.35, HOLE_SURFACE_SEGMENTS, HOLE_SURFACE_SEGMENTS);
}

function getRimMat(): THREE.MeshStandardMaterial {
  return _rimMat ??= new THREE.MeshStandardMaterial({
    color: RIM_COLOR,
    alphaMap: getRimMask(),
    transparent: true,
    alphaTest: 0.12,
    roughness: 0.95,
    metalness: 0,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    side: THREE.DoubleSide,
  });
}

let _dirtGeo: THREE.SphereGeometry | null = null;
let _dirtMat: THREE.MeshStandardMaterial | null = null;
function getDirtGeo(): THREE.SphereGeometry { return _dirtGeo ??= new THREE.SphereGeometry(0.18, 5, 4); }
function getDirtMat(): THREE.MeshStandardMaterial { return _dirtMat ??= new THREE.MeshStandardMaterial({ color: DIRT_COLOR, roughness: 1 }); }

let _grassMat: THREE.MeshStandardMaterial | null = null;
function getGrassMat(): THREE.MeshStandardMaterial {
  return _grassMat ??= new THREE.MeshStandardMaterial({ color: GRASS_TUFT, roughness: 0.85, side: THREE.DoubleSide });
}

let _rootMat: THREE.MeshStandardMaterial | null = null;
function getRootMat(): THREE.MeshStandardMaterial { return _rootMat ??= new THREE.MeshStandardMaterial({ color: ROOT_COLOR, roughness: 0.95 }); }

let _holeSurfaceTex: THREE.CanvasTexture | null = null;
let _holeCircleMask: THREE.CanvasTexture | null = null;
let _rimMask: THREE.CanvasTexture | null = null;

function getHoleSurfaceTexture(): THREE.CanvasTexture {
  if (_holeSurfaceTex) return _holeSurfaceTex;
  const canvas = document.createElement('canvas');
  canvas.width = HOLE_TEX_SIZE;
  canvas.height = HOLE_TEX_SIZE;
  const ctx = canvas.getContext('2d')!;
  const c = HOLE_TEX_SIZE * 0.5;
  const grad = ctx.createRadialGradient(c, c, HOLE_TEX_SIZE * 0.08, c, c, HOLE_TEX_SIZE * 0.5);
  grad.addColorStop(0, '#2a1a18');
  grad.addColorStop(0.45, '#3a2521');
  grad.addColorStop(1, '#5a4036');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, HOLE_TEX_SIZE, HOLE_TEX_SIZE);
  _holeSurfaceTex = new THREE.CanvasTexture(canvas);
  return _holeSurfaceTex;
}

function getHoleCircleMask(): THREE.CanvasTexture {
  if (_holeCircleMask) return _holeCircleMask;
  _holeCircleMask = buildRadialMask(0.08, 0.78, 0.98);
  return _holeCircleMask;
}

function getRimMask(): THREE.CanvasTexture {
  if (_rimMask) return _rimMask;
  _rimMask = buildRingMask(0.48, 0.86, 0.98);
  return _rimMask;
}

function buildRadialMask(inner: number, fadeStart: number, fadeEnd: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = HOLE_TEX_SIZE;
  canvas.height = HOLE_TEX_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, HOLE_TEX_SIZE, HOLE_TEX_SIZE);
  const c = HOLE_TEX_SIZE * 0.5;
  const radius = HOLE_TEX_SIZE * 0.5;
  const grad = ctx.createRadialGradient(c, c, radius * inner, c, c, radius * fadeEnd);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(fadeStart / fadeEnd, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, radius, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

function buildRingMask(inner: number, ring: number, outer: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = HOLE_TEX_SIZE;
  canvas.height = HOLE_TEX_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, HOLE_TEX_SIZE, HOLE_TEX_SIZE);
  const c = HOLE_TEX_SIZE * 0.5;
  const radius = HOLE_TEX_SIZE * 0.5;
  const grad = ctx.createRadialGradient(c, c, radius * inner, c, c, radius * outer);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop((inner + 0.02) / outer, 'rgba(255,255,255,0)');
  grad.addColorStop(ring / outer, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, radius, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

/** Build a ground hole with rim, dirt, grass tufts, and root detail. */
export function buildHoleMesh(): THREE.Group {
  const group = new THREE.Group();
  group.add(buildHoleDisc());
  group.add(buildRim());
  addDirtMounds(group);
  addGrassTufts(group);
  addRootTendrils(group);
  return group;
}

function buildHoleDisc(): THREE.Mesh {
  const mesh = new THREE.Mesh(getDiscGeo(), getDiscMat());
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = HOLE_SURFACE_OFFSET;
  mesh.renderOrder = 2;
  return markTerrainSurface(mesh, HOLE_SURFACE_OFFSET);
}

function buildRim(): THREE.Mesh {
  const mesh = new THREE.Mesh(getRimGeo(), getRimMat());
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = HOLE_RIM_OFFSET;
  mesh.renderOrder = 3;
  return markTerrainSurface(mesh, HOLE_RIM_OFFSET);
}

function addDirtMounds(group: THREE.Group): void {
  const count = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const mound = new THREE.Mesh(getDirtGeo(), getDirtMat());
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 0.7 + Math.random() * 0.3;
    mound.position.set(
      Math.cos(angle) * dist,
      HOLE_DETAIL_OFFSET,
      Math.sin(angle) * dist,
    );
    mound.scale.set(
      1.2 + Math.random() * 0.5,
      0.3 + Math.random() * 0.3,
      1.0 + Math.random() * 0.3,
    );
    group.add(markTerrainAnchor(mound, HOLE_DETAIL_OFFSET));
  }
}

/** Small grass tufts around the hole rim. */
function addGrassTufts(group: THREE.Group): void {
  const count = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 0.8 + Math.random() * 0.15;

    // Each tuft is a cluster of 2-3 thin blades
    const blades = 2 + Math.floor(Math.random() * 2);
    for (let b = 0; b < blades; b++) {
      const geo = new THREE.PlaneGeometry(0.04, 0.15 + Math.random() * 0.1);
      const blade = new THREE.Mesh(geo, getGrassMat());
      blade.position.set(
        Math.cos(angle) * dist + (Math.random() - 0.5) * 0.05,
        HOLE_DETAIL_OFFSET + 0.03,
        Math.sin(angle) * dist + (Math.random() - 0.5) * 0.05,
      );
      blade.rotation.y = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      blade.rotation.x = -0.3 + Math.random() * 0.2;
      group.add(markTerrainAnchor(blade, HOLE_DETAIL_OFFSET + 0.03));
    }
  }
}

/** Thin root tendrils peeking over the hole edge. */
function addRootTendrils(group: THREE.Group): void {
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const geo = new THREE.CylinderGeometry(0.015, 0.02, 0.3 + Math.random() * 0.15, 4);
    const root = new THREE.Mesh(geo, getRootMat());
    const angle = Math.random() * Math.PI * 2;
    root.position.set(
      Math.cos(angle) * 0.7,
      HOLE_DETAIL_OFFSET,
      Math.sin(angle) * 0.7,
    );
    root.rotation.z = Math.cos(angle) * 0.8;
    root.rotation.x = Math.sin(angle) * 0.8;
    group.add(markTerrainAnchor(root, HOLE_DETAIL_OFFSET));
  }
}
