import * as THREE from 'three';

/** Palette for jungle bushes. */
const BUSH_LIGHT = 0x4caf50;
const BUSH_MID = 0x388e3c;
const BUSH_DARK = 0x2e7d32;
const BERRY_COLOR = 0xe53935;

/** Build a multi-sphere bush cluster with berry accents. */
export function buildBushMesh(): THREE.Group {
  const group = new THREE.Group();
  group.add(buildLobe(BUSH_MID, 1.0, 0, 0.7, 0));
  group.add(buildLobe(BUSH_LIGHT, 0.75, -0.5, 0.55, 0.3));
  group.add(buildLobe(BUSH_DARK, 0.7, 0.45, 0.5, -0.35));
  group.add(buildLobe(BUSH_LIGHT, 0.55, 0.1, 0.45, 0.55));
  addBerries(group);
  return group;
}

function buildLobe(color: number, radius: number, x: number, y: number, z: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 7, 6);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

function addBerries(group: THREE.Group): void {
  const geo = new THREE.SphereGeometry(0.06, 4, 4);
  const mat = new THREE.MeshStandardMaterial({ color: BERRY_COLOR });
  const offsets = [[0.6, 0.5, 0.4], [-0.4, 0.6, -0.3], [0.3, 0.3, -0.5]];
  for (const [x, y, z] of offsets) {
    const berry = new THREE.Mesh(geo, mat);
    berry.position.set(x, y, z);
    group.add(berry);
  }
}
