import * as THREE from 'three';
import { buildStoneNormalMap } from '../procedural-normal.builder';

/** Palette for jungle rocks. */
const ROCK_BASE = 0x757575;
const ROCK_ACCENT = 0x8d8d8d;
const ROCK_DARK = 0x616161;
const MOSS_COLOR = 0x558b2f;
const LICHEN_COLOR = 0x9e9d24;

/** Shared stone normal map (generated once). */
let stoneNormal: THREE.CanvasTexture | null = null;
function getStoneNormal(): THREE.CanvasTexture {
  stoneNormal ??= buildStoneNormalMap(128);
  return stoneNormal;
}

/** Cached chip materials keyed by colour. */
const chipMatCache = new Map<number, THREE.MeshStandardMaterial>();
function getChipMat(color: number): THREE.MeshStandardMaterial {
  let m = chipMatCache.get(color);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }); chipMatCache.set(color, m); }
  return m;
}

let _mossMat: THREE.MeshStandardMaterial | null = null;
function getMossMat(): THREE.MeshStandardMaterial { return _mossMat ??= new THREE.MeshStandardMaterial({ color: MOSS_COLOR, roughness: 0.9 }); }

let _lichenGeo: THREE.CircleGeometry | null = null;
let _lichenMat: THREE.MeshStandardMaterial | null = null;
function getLichenGeo(): THREE.CircleGeometry { return _lichenGeo ??= new THREE.CircleGeometry(0.1, 6); }
function getLichenMat(): THREE.MeshStandardMaterial {
  return _lichenMat ??= new THREE.MeshStandardMaterial({ color: LICHEN_COLOR, roughness: 0.95, side: THREE.DoubleSide });
}

/** Build a multi-part rock with moss, lichen, and varied chips. */
export function buildRockMesh(): THREE.Group {
  const group = new THREE.Group();

  // Randomized main stone size and shape
  const scale = 0.8 + Math.random() * 0.5;
  group.add(buildMainStone(scale));

  // Scattered chip rocks around the base
  const chipCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < chipCount; i++) {
    const angle = (i / chipCount) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 0.5 + Math.random() * 0.5;
    group.add(buildChip(
      Math.cos(angle) * dist * scale,
      0,
      Math.sin(angle) * dist * scale,
    ));
  }

  group.add(buildMossPatch(scale));
  addLichenPatches(group, scale);

  return group;
}

function buildMainStone(scale: number): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(1.2 * scale, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: ROCK_BASE,
    roughness: 1,
    flatShading: true,
    normalMap: getStoneNormal(),
    normalScale: new THREE.Vector2(1.2, 1.2),
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.5 * scale;
  // Randomized squash for varied silhouettes
  const squashY = 0.55 + Math.random() * 0.3;
  const squashXZ = 0.85 + Math.random() * 0.3;
  mesh.scale.set(squashXZ, squashY, squashXZ);
  mesh.rotation.y = Math.random() * Math.PI * 2;
  mesh.castShadow = true;
  return mesh;
}

function buildChip(x: number, y: number, z: number): THREE.Mesh {
  const size = 0.2 + Math.random() * 0.2;
  const geo = new THREE.DodecahedronGeometry(size, 0);
  const color = Math.random() > 0.5 ? ROCK_ACCENT : ROCK_DARK;
  const mesh = new THREE.Mesh(geo, getChipMat(color));
  mesh.position.set(x, y + size * 0.4, z);
  mesh.rotation.set(Math.random(), Math.random(), Math.random());
  mesh.castShadow = true;
  return mesh;
}

function buildMossPatch(scale: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.4 * scale, 5, 4);
  const mesh = new THREE.Mesh(geo, getMossMat());
  const angle = Math.random() * Math.PI * 2;
  mesh.position.set(Math.cos(angle) * 0.4 * scale, 0.5 * scale, Math.sin(angle) * 0.4 * scale);
  mesh.scale.set(1, 0.3, 1);
  return mesh;
}

/** Small yellowish lichen splotches on the stone surface. */
function addLichenPatches(group: THREE.Group, scale: number): void {
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const patch = new THREE.Mesh(getLichenGeo(), getLichenMat());
    const angle = Math.random() * Math.PI * 2;
    const height = 0.3 + Math.random() * 0.4;
    patch.position.set(
      Math.cos(angle) * 0.55 * scale,
      height * scale,
      Math.sin(angle) * 0.55 * scale,
    );
    patch.lookAt(
      Math.cos(angle) * 2 * scale,
      height * scale,
      Math.sin(angle) * 2 * scale,
    );
    group.add(patch);
  }
}
