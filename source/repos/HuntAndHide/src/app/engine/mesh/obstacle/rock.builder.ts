import * as THREE from 'three';
import { buildStoneNormalMap } from '../procedural-normal.builder';

/** Palette for jungle rocks. */
const ROCK_BASE = 0x757575;
const ROCK_ACCENT = 0x8d8d8d;
const MOSS_COLOR = 0x558b2f;

/** Shared stone normal map (generated once). */
let stoneNormal: THREE.CanvasTexture | null = null;
function getStoneNormal(): THREE.CanvasTexture {
  stoneNormal ??= buildStoneNormalMap(128);
  return stoneNormal;
}

/** Build a multi-part rock with moss accent. */
export function buildRockMesh(): THREE.Group {
  const group = new THREE.Group();
  group.add(buildMainStone());
  group.add(buildChip(0.6, 0.1, -0.5));
  group.add(buildChip(-0.4, 0.05, 0.6));
  group.add(buildMossPatch());
  return group;
}

function buildMainStone(): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(1.2, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: ROCK_BASE,
    roughness: 1,
    flatShading: true,
    normalMap: getStoneNormal(),
    normalScale: new THREE.Vector2(1.2, 1.2),
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.5;
  mesh.scale.set(1, 0.7, 1);
  mesh.castShadow = true;
  return mesh;
}

function buildChip(x: number, y: number, z: number): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(0.35, 0);
  const mat = new THREE.MeshStandardMaterial({ color: ROCK_ACCENT, roughness: 1, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y + 0.15, z);
  mesh.castShadow = true;
  return mesh;
}

function buildMossPatch(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.4, 5, 4);
  const mat = new THREE.MeshStandardMaterial({ color: MOSS_COLOR, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0.5, 0.6, 0.3);
  mesh.scale.set(1, 0.3, 1);
  return mesh;
}
