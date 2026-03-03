import * as THREE from 'three';

/** Palette for jungle bushes. */
const BUSH_LIGHT = 0x4caf50;
const BUSH_MID = 0x388e3c;
const BUSH_DARK = 0x2e7d32;
const BERRY_COLOR = 0xe53935;
const BERRY_ALT = 0xffa726;
const TWIG_COLOR = 0x5d4037;

/** Lobe config: [color, radius, x, y, z]. */
const BASE_LOBES: [number, number, number, number, number][] = [
  [BUSH_MID,   1.0,   0,    0.7,  0],
  [BUSH_LIGHT, 0.75, -0.5,  0.55, 0.3],
  [BUSH_DARK,  0.7,   0.45, 0.5, -0.35],
  [BUSH_LIGHT, 0.55,  0.1,  0.45, 0.55],
];

/** Build a multi-sphere bush cluster with berry accents and detail. */
export function buildBushMesh(): THREE.Group {
  const group = new THREE.Group();

  // Random scale multiplier for bush variety
  const sizeMul = 0.85 + Math.random() * 0.35;

  // Main foliage lobes
  for (const [color, radius, x, y, z] of BASE_LOBES) {
    group.add(buildLobe(color, radius * sizeMul, x * sizeMul, y * sizeMul, z * sizeMul));
  }

  // Extra filler lobe for fullness
  const fillerAngle = Math.random() * Math.PI * 2;
  group.add(buildLobe(
    BUSH_MID,
    0.45 * sizeMul,
    Math.cos(fillerAngle) * 0.35 * sizeMul,
    0.5 * sizeMul,
    Math.sin(fillerAngle) * 0.35 * sizeMul,
  ));

  addBerries(group, sizeMul);
  addTwigs(group, sizeMul);

  return group;
}

function buildLobe(color: number, radius: number, x: number, y: number, z: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 7, 6);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  // Slight random squash for organic look
  const squash = 0.9 + Math.random() * 0.2;
  mesh.scale.set(squash, 0.85 + Math.random() * 0.3, squash);
  mesh.castShadow = true;
  return mesh;
}

function addBerries(group: THREE.Group, sizeMul: number): void {
  const geo = new THREE.SphereGeometry(0.06, 6, 6);
  const colors = [BERRY_COLOR, BERRY_ALT, BERRY_COLOR];
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: colors[i % colors.length],
      roughness: 0.4,
      metalness: 0.05,
    });
    const berry = new THREE.Mesh(geo, mat);
    const angle = (i / count) * Math.PI * 2 + Math.random();
    berry.position.set(
      Math.cos(angle) * 0.55 * sizeMul,
      0.35 + Math.random() * 0.4,
      Math.sin(angle) * 0.55 * sizeMul,
    );
    group.add(berry);
  }
}

/** Small protruding twig sticks for natural detail. */
function addTwigs(group: THREE.Group, sizeMul: number): void {
  const mat = new THREE.MeshStandardMaterial({ color: TWIG_COLOR, roughness: 1 });
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const geo = new THREE.CylinderGeometry(0.012, 0.018, 0.3 + Math.random() * 0.2, 4);
    const twig = new THREE.Mesh(geo, mat);
    const angle = Math.random() * Math.PI * 2;
    twig.position.set(
      Math.cos(angle) * 0.5 * sizeMul,
      0.6 + Math.random() * 0.3,
      Math.sin(angle) * 0.5 * sizeMul,
    );
    twig.rotation.z = (Math.random() - 0.5) * 0.8;
    twig.rotation.x = (Math.random() - 0.5) * 0.5;
    group.add(twig);
  }
}
