import * as THREE from 'three';
import { buildRoughnessMap } from '../procedural-normal.builder';

/** Palette for abandoned safari vehicles. */
const BODY_COLOR = 0x795548;
const BODY_DARK = 0x5d4037;
const WHEEL_COLOR = 0x212121;
const WINDOW_COLOR = 0x80cbc4;
const RUST_COLOR = 0xbf360c;

/** Shared vehicle roughness map (generated once). */
let vehicleRoughness: THREE.CanvasTexture | null = null;
function getVehicleRoughness(): THREE.CanvasTexture {
  vehicleRoughness ??= buildRoughnessMap(128, 50);
  return vehicleRoughness;
}

/** Vehicle dimensions keyed by type. */
const VEHICLE_DIMS: Record<string, { w: number; d: number; h: number }> = {
  jeep:  { w: 2,   d: 4,   h: 1.8 },
  truck: { w: 2.5, d: 5,   h: 2.2 },
};

/** Build a multi-part abandoned vehicle (body + cabin + wheels + rust). */
export function buildVehicleMesh(type: string): THREE.Group {
  const dims = VEHICLE_DIMS[type] ?? VEHICLE_DIMS['jeep'];
  const group = new THREE.Group();
  group.add(buildBody(dims));
  group.add(buildCabin(dims));
  addWheels(group, dims);
  addRustPatches(group, dims);
  return group;
}

function buildBody(d: { w: number; d: number; h: number }): THREE.Mesh {
  const geo = new THREE.BoxGeometry(d.w, d.h * 0.5, d.d);
  const mat = new THREE.MeshStandardMaterial({
    color: BODY_COLOR,
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
  const mat = new THREE.MeshStandardMaterial({ color: BODY_DARK, roughness: 0.8 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, d.h * 0.6, -d.d * 0.12);
  mesh.castShadow = true;

  const windowGeo = new THREE.PlaneGeometry(d.w * 0.7, d.h * 0.3);
  const windowMat = new THREE.MeshStandardMaterial({
    color: WINDOW_COLOR,
    metalness: 0.4,
    roughness: 0.2,
    transparent: true,
    opacity: 0.6,
  });
  const windowMesh = new THREE.Mesh(windowGeo, windowMat);
  windowMesh.position.set(0, d.h * 0.05, d.d * 0.23);
  mesh.add(windowMesh);

  return mesh;
}

function addWheels(group: THREE.Group, d: { w: number; d: number; h: number }): void {
  const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8);
  geo.rotateZ(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: WHEEL_COLOR, roughness: 1 });
  const xOff = d.w * 0.55;
  const zOff = d.d * 0.32;

  const positions = [
    [-xOff, 0.35, -zOff], [xOff, 0.35, -zOff],
    [-xOff, 0.35, zOff],  [xOff, 0.35, zOff],
  ];
  for (const [x, y, z] of positions) {
    const wheel = new THREE.Mesh(geo, mat);
    wheel.position.set(x, y, z);
    group.add(wheel);
  }
}

function addRustPatches(group: THREE.Group, d: { w: number; d: number; h: number }): void {
  const geo = new THREE.SphereGeometry(0.2, 4, 4);
  const mat = new THREE.MeshStandardMaterial({ color: RUST_COLOR, roughness: 1 });
  const patches = [
    [d.w * 0.5, d.h * 0.3, d.d * 0.3],
    [-d.w * 0.45, d.h * 0.15, -d.d * 0.25],
  ];
  for (const [x, y, z] of patches) {
    const rust = new THREE.Mesh(geo, mat);
    rust.position.set(x, y, z);
    rust.scale.set(1.5, 0.3, 1);
    group.add(rust);
  }
}
