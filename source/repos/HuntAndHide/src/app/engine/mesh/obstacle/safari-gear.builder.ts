import * as THREE from 'three';

/** Palette for abandoned safari gear. */
const CRATE_COLOR = 0xa1887f;
const CRATE_DARK = 0x8d6e63;
const STRAP_COLOR = 0x5d4037;
const METAL_COLOR = 0x9e9e9e;
const CANVAS_COLOR = 0x8d7b5e;
const ROPE_COLOR = 0xc8b48a;

/** Gear item builders keyed by index — random selection gives variety. */
const GEAR_VARIANTS: (() => THREE.Group)[] = [
  buildCrateSet,
  buildBinocularsSet,
  buildCanteenSet,
];

/** Build a randomized safari gear piece. */
export function buildSafariGearMesh(): THREE.Group {
  const variant = GEAR_VARIANTS[Math.floor(Math.random() * GEAR_VARIANTS.length)];
  return variant();
}

// ── Variant 1: Crate with strap and buckle ───────────────────

function buildCrateSet(): THREE.Group {
  const group = new THREE.Group();

  const crate = buildBox(0.6, 0.4, 0.6, CRATE_COLOR);
  crate.position.y = 0.2;
  group.add(crate);

  // Plank lines on crate for wood detail
  const plankMat = new THREE.MeshStandardMaterial({ color: CRATE_DARK, roughness: 0.95 });
  const plankOffsets = [-0.12, 0, 0.12];
  for (const z of plankOffsets) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.02), plankMat);
    plank.position.set(0, 0.2, z);
    group.add(plank);
  }

  // Strap
  const strap = buildBox(0.65, 0.06, 0.08, STRAP_COLOR);
  strap.position.set(0, 0.32, 0);
  group.add(strap);

  // Buckle
  const buckle = buildBox(0.1, 0.08, 0.1, METAL_COLOR, 0.5, 0.3);
  buckle.position.set(0.2, 0.33, 0);
  group.add(buckle);

  // Rope coil nearby
  addRopeCoil(group, -0.4, 0, 0.3);

  return group;
}

// ── Variant 2: Binoculars with canvas bag ────────────────────

function buildBinocularsSet(): THREE.Group {
  const group = new THREE.Group();

  // Canvas bag
  const bag = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.3, 8),
    new THREE.MeshStandardMaterial({ color: CANVAS_COLOR, roughness: 0.9 }),
  );
  bag.position.set(0, 0.15, 0);
  bag.castShadow = true;
  group.add(bag);

  // Binocular tubes
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0x424242, roughness: 0.5, metalness: 0.3 });
  for (const side of [-1, 1]) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), tubeMat);
    tube.position.set(side * 0.06, 0.35, 0.1);
    tube.rotation.x = -0.3;
    group.add(tube);

    // Lens cap
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0x80cbc4, metalness: 0.4, roughness: 0.2 }),
    );
    lens.position.set(side * 0.06, 0.38, 0.2);
    lens.rotation.x = -0.3;
    group.add(lens);
  }

  // Neck strap
  const strap = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.01, 4, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: STRAP_COLOR, roughness: 0.9 }),
  );
  strap.position.set(0, 0.32, 0);
  strap.rotation.x = Math.PI / 2;
  group.add(strap);

  return group;
}

// ── Variant 3: Canteen with rope ─────────────────────────────

function buildCanteenSet(): THREE.Group {
  const group = new THREE.Group();

  // Canteen body — rounded cylinder
  const canteen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: METAL_COLOR, metalness: 0.3, roughness: 0.6 }),
  );
  canteen.position.set(0, 0.12, 0);
  canteen.rotation.x = Math.PI / 2;
  canteen.castShadow = true;
  group.add(canteen);

  // Cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.04, 6),
    new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.8 }),
  );
  cap.position.set(0, 0.17, 0);
  group.add(cap);

  // Canvas wrap
  const wrap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.05, 12),
    new THREE.MeshStandardMaterial({ color: CANVAS_COLOR, roughness: 0.9 }),
  );
  wrap.position.set(0, 0.12, 0);
  wrap.rotation.x = Math.PI / 2;
  group.add(wrap);

  addRopeCoil(group, 0.2, 0, -0.1);

  return group;
}

// ── Shared helpers ───────────────────────────────────────────

function buildBox(w: number, h: number, d: number, color: number, metalness = 0, roughness = 0.9): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function addRopeCoil(group: THREE.Group, x: number, y: number, z: number): void {
  const rope = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.02, 6, 12),
    new THREE.MeshStandardMaterial({ color: ROPE_COLOR, roughness: 0.95 }),
  );
  rope.position.set(x, y + 0.08, z);
  rope.rotation.x = -Math.PI / 2;
  group.add(rope);
}
