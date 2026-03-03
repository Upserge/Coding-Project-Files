import * as THREE from 'three';

/** Palette for leaf piles. */
const LEAF_BROWN = 0x8d6e63;
const LEAF_ORANGE = 0xcc8033;
const LEAF_GREEN = 0x6d8b3a;
const LEAF_RED = 0xa1583a;
const TWIG_COLOR = 0x5d4037;

const LEAF_COLORS = [LEAF_BROWN, LEAF_ORANGE, LEAF_GREEN, LEAF_RED];

/** Build a leafy pile from stacked discs with scattered individual leaves. */
export function buildLeafPileMesh(): THREE.Group {
  const group = new THREE.Group();

  const sizeMul = 0.85 + Math.random() * 0.3;

  // Layered disc base with slight offsets for natural look
  group.add(buildLayer(LEAF_BROWN,  1.5 * sizeMul, 0.08, 0.04, (Math.random() - 0.5) * 0.15));
  group.add(buildLayer(LEAF_ORANGE, 1.2 * sizeMul, 0.10, 0.14, (Math.random() - 0.5) * 0.15));
  group.add(buildLayer(LEAF_GREEN,  0.8 * sizeMul, 0.06, 0.22, (Math.random() - 0.5) * 0.15));

  addScatteredLeaves(group, sizeMul);
  addCurledLeaves(group, sizeMul);
  addTwigs(group, sizeMul);

  return group;
}

function buildLayer(color: number, radius: number, height: number, y: number, offsetX: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius * 0.85, radius, height, 8);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(offsetX, y, 0);
  mesh.rotation.y = Math.random() * Math.PI;
  mesh.receiveShadow = true;
  return mesh;
}

/** Flat plane leaves scattered around the edges. */
function addScatteredLeaves(group: THREE.Group, sizeMul: number): void {
  const geo = new THREE.PlaneGeometry(0.2, 0.12);
  const count = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const color = LEAF_COLORS[i % LEAF_COLORS.length];
    const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.9 });
    const leaf = new THREE.Mesh(geo, mat);
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 0.7 + Math.random() * 0.5;
    leaf.position.set(
      Math.cos(angle) * dist * sizeMul,
      0.01 + Math.random() * 0.04,
      Math.sin(angle) * dist * sizeMul,
    );
    leaf.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    leaf.rotation.z = Math.random() * Math.PI * 2;
    group.add(leaf);
  }
}

/** Slightly curved leaf shapes resting on top. */
function addCurledLeaves(group: THREE.Group, sizeMul: number): void {
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const color = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
    const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.9 });

    // Curved leaf via a bent plane
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.08, 0.06, 0.03, 0.15);
    shape.lineTo(0, 0.17);
    shape.lineTo(-0.03, 0.15);
    shape.quadraticCurveTo(-0.08, 0.06, 0, 0);
    const geo = new THREE.ShapeGeometry(shape);
    const leaf = new THREE.Mesh(geo, mat);

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 0.6 * sizeMul;
    leaf.position.set(
      Math.cos(angle) * dist,
      0.18 + Math.random() * 0.08,
      Math.sin(angle) * dist,
    );
    leaf.rotation.x = -0.9 + Math.random() * 0.4;
    leaf.rotation.y = Math.random() * Math.PI * 2;
    group.add(leaf);
  }
}

/** Small twigs poking out of the pile. */
function addTwigs(group: THREE.Group, sizeMul: number): void {
  const mat = new THREE.MeshStandardMaterial({ color: TWIG_COLOR, roughness: 1 });
  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const geo = new THREE.CylinderGeometry(0.01, 0.015, 0.25 + Math.random() * 0.15, 4);
    const twig = new THREE.Mesh(geo, mat);
    const angle = Math.random() * Math.PI * 2;
    twig.position.set(
      Math.cos(angle) * 0.4 * sizeMul,
      0.15,
      Math.sin(angle) * 0.4 * sizeMul,
    );
    twig.rotation.z = (Math.random() - 0.5) * 1.0;
    twig.rotation.x = (Math.random() - 0.5) * 0.5;
    group.add(twig);
  }
}
