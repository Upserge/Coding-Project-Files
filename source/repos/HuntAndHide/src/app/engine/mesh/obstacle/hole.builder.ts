import * as THREE from 'three';

/** Palette for ground holes. */
const HOLE_COLOR = 0x3e2723;
const RIM_COLOR = 0x5d4037;
const DIRT_COLOR = 0x795548;
const GRASS_TUFT = 0x4a7a3a;
const ROOT_COLOR = 0x4e342e;

// ── Cached geometries & materials (shared across all hole instances) ──

let _discGeo: THREE.CylinderGeometry | null = null;
let _discMat: THREE.MeshStandardMaterial | null = null;
function getDiscGeo(): THREE.CylinderGeometry { return _discGeo ??= new THREE.CylinderGeometry(0.8, 0.8, 0.08, 12); }
function getDiscMat(): THREE.MeshStandardMaterial { return _discMat ??= new THREE.MeshStandardMaterial({ color: HOLE_COLOR, roughness: 1 }); }

let _rimGeo: THREE.TorusGeometry | null = null;
let _rimMat: THREE.MeshStandardMaterial | null = null;
function getRimGeo(): THREE.TorusGeometry { return _rimGeo ??= new THREE.TorusGeometry(0.85, 0.12, 6, 16); }
function getRimMat(): THREE.MeshStandardMaterial { return _rimMat ??= new THREE.MeshStandardMaterial({ color: RIM_COLOR, roughness: 0.95 }); }

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
  mesh.position.y = -0.02;
  return mesh;
}

function buildRim(): THREE.Mesh {
  const mesh = new THREE.Mesh(getRimGeo(), getRimMat());
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  return mesh;
}

function addDirtMounds(group: THREE.Group): void {
  const count = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const mound = new THREE.Mesh(getDirtGeo(), getDirtMat());
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 0.7 + Math.random() * 0.3;
    mound.position.set(
      Math.cos(angle) * dist,
      0.04,
      Math.sin(angle) * dist,
    );
    mound.scale.set(
      1.2 + Math.random() * 0.5,
      0.3 + Math.random() * 0.3,
      1.0 + Math.random() * 0.3,
    );
    group.add(mound);
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
        0.06,
        Math.sin(angle) * dist + (Math.random() - 0.5) * 0.05,
      );
      blade.rotation.y = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      blade.rotation.x = -0.3 + Math.random() * 0.2;
      group.add(blade);
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
      0.02,
      Math.sin(angle) * 0.7,
    );
    root.rotation.z = Math.cos(angle) * 0.8;
    root.rotation.x = Math.sin(angle) * 0.8;
    group.add(root);
  }
}
