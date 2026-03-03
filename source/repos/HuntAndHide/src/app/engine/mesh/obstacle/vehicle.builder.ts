import * as THREE from 'three';
import { buildRoughnessMap } from '../procedural-normal.builder';

/** Palette for abandoned safari vehicles. */
const RANDOM_BODY_COLORS = [
  0xB5351F, //red
  0xE3D422, //yellow
  0x1140AB, //blue
  0x29C23A, //green
  0x29B0C2, //cyan
  0x4e342e //brown
  ]
const BODY_DARK = 0x5d4037;
const WHEEL_COLOR = 0x212121;
const WINDOW_COLOR = 0x80cbc4;
const RUST_COLOR = 0xbf360c;
const VINE_COLOR = 0x33691e;
const MOSS_COLOR = 0x558b2f;
const CRACK_COLOR = 0xb0bec5;

function getRandomBodyColor(): number {
  const randomIndex = Math.floor(Math.random() * RANDOM_BODY_COLORS.length);
  return RANDOM_BODY_COLORS[randomIndex];
}

/** Shared vehicle roughness map (generated once). */
let vehicleRoughness: THREE.CanvasTexture | null = null;
function getVehicleRoughness(): THREE.CanvasTexture {
  vehicleRoughness ??= buildRoughnessMap(128, 50);
  return vehicleRoughness;
}

// ── Shared vehicle part materials/geometries ──
let _wheelGeo: THREE.CylinderGeometry | null = null;
let _wheelMat: THREE.MeshStandardMaterial | null = null;
function getWheelGeo(): THREE.CylinderGeometry {
  if (!_wheelGeo) { _wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8); _wheelGeo.rotateZ(Math.PI / 2); }
  return _wheelGeo;
}
function getWheelMat(): THREE.MeshStandardMaterial { return _wheelMat ??= new THREE.MeshStandardMaterial({ color: WHEEL_COLOR, roughness: 1 }); }

let _hubGeo: THREE.CylinderGeometry | null = null;
let _hubMat: THREE.MeshStandardMaterial | null = null;
function getHubGeo(): THREE.CylinderGeometry {
  if (!_hubGeo) { _hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.26, 6); _hubGeo.rotateZ(Math.PI / 2); }
  return _hubGeo;
}
function getHubMat(): THREE.MeshStandardMaterial { return _hubMat ??= new THREE.MeshStandardMaterial({ color: 0x616161, metalness: 0.3, roughness: 0.5 }); }

let _cabinMat: THREE.MeshStandardMaterial | null = null;
function getCabinMat(): THREE.MeshStandardMaterial { return _cabinMat ??= new THREE.MeshStandardMaterial({ color: BODY_DARK, roughness: 0.8 }); }

let _windowMat: THREE.MeshStandardMaterial | null = null;
function getWindowMat(): THREE.MeshStandardMaterial {
  return _windowMat ??= new THREE.MeshStandardMaterial({ color: WINDOW_COLOR, metalness: 0.4, roughness: 0.2, transparent: true, opacity: 0.6 });
}

let _rustGeo: THREE.SphereGeometry | null = null;
let _rustMat: THREE.MeshStandardMaterial | null = null;
function getRustGeo(): THREE.SphereGeometry { return _rustGeo ??= new THREE.SphereGeometry(0.2, 4, 4); }
function getRustMat(): THREE.MeshStandardMaterial { return _rustMat ??= new THREE.MeshStandardMaterial({ color: RUST_COLOR, roughness: 1 }); }

let _vineMat: THREE.MeshStandardMaterial | null = null;
function getVineMat(): THREE.MeshStandardMaterial { return _vineMat ??= new THREE.MeshStandardMaterial({ color: VINE_COLOR, roughness: 0.85 }); }

let _mossGeo: THREE.SphereGeometry | null = null;
let _mossMat: THREE.MeshStandardMaterial | null = null;
function getMossGeo(): THREE.SphereGeometry { return _mossGeo ??= new THREE.SphereGeometry(0.15, 5, 4); }
function getMossMat(): THREE.MeshStandardMaterial { return _mossMat ??= new THREE.MeshStandardMaterial({ color: MOSS_COLOR, roughness: 0.9 }); }

let _crackMat: THREE.MeshStandardMaterial | null = null;
function getCrackMat(): THREE.MeshStandardMaterial {
  return _crackMat ??= new THREE.MeshStandardMaterial({ color: CRACK_COLOR, roughness: 0.3, transparent: true, opacity: 0.4 });
}

/** Vehicle dimensions keyed by type. */
const VEHICLE_DIMS: Record<string, { w: number; d: number; h: number }> = {
  jeep:  { w: 2,   d: 4,   h: 1.8 },
  truck: { w: 2.5, d: 5,   h: 2.2 },
};

/** Build a multi-part abandoned vehicle with overgrowth and wear detail. */
export function buildVehicleMesh(type: string): THREE.Group {
  const dims = VEHICLE_DIMS[type] ?? VEHICLE_DIMS['jeep'];
  const group = new THREE.Group();
  group.add(buildBody(dims));
  group.add(buildCabin(dims));
  addWheels(group, dims);
  addRustPatches(group, dims);
  addVineOvergrowth(group, dims);
  addMossPatches(group, dims);
  addWindowCracks(group, dims);
  return group;
}

function buildBody(d: { w: number; d: number; h: number }): THREE.Mesh {
  const geo = new THREE.BoxGeometry(d.w, d.h * 0.5, d.d);
  const mat = new THREE.MeshStandardMaterial({
    color: getRandomBodyColor(),
    roughness: 0.9,
    roughnessMap: getVehicleRoughness(),
    metalness: 0.15,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = d.h * 0.25;
  mesh.castShadow = true;
  return mesh;
}

function buildCabin(d: { w: number; d: number; h: number }): THREE.Mesh {
  const geo = new THREE.BoxGeometry(d.w * 0.85, d.h * 0.45, d.d * 0.45);
  const mesh = new THREE.Mesh(geo, getCabinMat());
  mesh.position.set(0, d.h * 0.6, -d.d * 0.12);
  mesh.castShadow = true;

  const windowGeo = new THREE.PlaneGeometry(d.w * 0.7, d.h * 0.3);
  const windowMesh = new THREE.Mesh(windowGeo, getWindowMat());
  windowMesh.position.set(0, d.h * 0.05, d.d * 0.23);
  mesh.add(windowMesh);

  return mesh;
}

function addWheels(group: THREE.Group, d: { w: number; d: number; h: number }): void {
  const xOff = d.w * 0.55;
  const zOff = d.d * 0.32;

  const positions: [number, number, number][] = [
    [-xOff, 0.35, -zOff], [xOff, 0.35, -zOff],
    [-xOff, 0.35, zOff],  [xOff, 0.35, zOff],
  ];
  for (const [x, y, z] of positions) {
    const wheel = new THREE.Mesh(getWheelGeo(), getWheelMat());
    wheel.position.set(x, y, z);
    group.add(wheel);
    const hub = new THREE.Mesh(getHubGeo(), getHubMat());
    hub.position.set(x, y, z);
    group.add(hub);
  }
}

function addRustPatches(group: THREE.Group, d: { w: number; d: number; h: number }): void {
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const rust = new THREE.Mesh(getRustGeo(), getRustMat());
    rust.position.set(
      (Math.random() - 0.5) * d.w,
      d.h * (0.1 + Math.random() * 0.3),
      (Math.random() - 0.5) * d.d,
    );
    rust.scale.set(1.2 + Math.random() * 0.5, 0.2 + Math.random() * 0.2, 0.8 + Math.random() * 0.4);
    group.add(rust);
  }
}

/** Vine tendrils climbing over the vehicle body. */
function addVineOvergrowth(group: THREE.Group, d: { w: number; d: number; h: number }): void {
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const length = 0.8 + Math.random() * 1.2;
    const geo = new THREE.CylinderGeometry(0.02, 0.025, length, 4);
    const vine = new THREE.Mesh(geo, getVineMat());
    vine.position.set(
      (Math.random() - 0.5) * d.w * 0.8,
      d.h * 0.4 + Math.random() * d.h * 0.3,
      (Math.random() - 0.5) * d.d * 0.6,
    );
    vine.rotation.z = (Math.random() - 0.5) * 1.2;
    vine.rotation.x = (Math.random() - 0.5) * 0.5;
    group.add(vine);

    const leafGeo = new THREE.SphereGeometry(0.06, 4, 4);
    const leaf = new THREE.Mesh(leafGeo, getVineMat());
    leaf.position.copy(vine.position);
    leaf.position.y += length * 0.3;
    leaf.scale.set(1.5, 0.5, 1.5);
    group.add(leaf);
  }
}

/** Moss growing on the body and wheels. */
function addMossPatches(group: THREE.Group, d: { w: number; d: number; h: number }): void {
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const moss = new THREE.Mesh(getMossGeo(), getMossMat());
    moss.position.set(
      (Math.random() - 0.5) * d.w,
      d.h * (0.05 + Math.random() * 0.15),
      (Math.random() - 0.5) * d.d,
    );
    moss.scale.set(1.5, 0.3, 1.2);
    group.add(moss);
  }
}

/** Subtle crack lines on windshield area. */
function addWindowCracks(group: THREE.Group, d: { w: number; d: number; h: number }): void {
  const crackCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < crackCount; i++) {
    const geo = new THREE.BoxGeometry(d.w * 0.3 * Math.random() + 0.1, 0.005, 0.005);
    const crack = new THREE.Mesh(geo, getCrackMat());
    crack.position.set(
      (Math.random() - 0.5) * d.w * 0.3,
      d.h * 0.65,
      -d.d * 0.12 + d.d * 0.23,
    );
    crack.rotation.z = (Math.random() - 0.5) * 0.5;
    group.add(crack);
  }
}
