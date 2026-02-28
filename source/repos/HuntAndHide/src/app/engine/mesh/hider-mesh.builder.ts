import * as THREE from 'three';
import {
  PART_NAMES,
  createBodyPivot,
  createHeadPivot,
  createTailPivot,
  attachCozyEyes,
  attachNose,
  attachBlush,
  attachLegs,
  attachFeetOnly,
} from './mesh-helpers';

/**
 * Dispatches to the per-animal hider builder.
 * Each hider has a unique silhouette.
 * Uses skeletal hierarchy: root -> bodyPivot -> headPivot / tailPivot; legs at root.
 */
export function buildHiderMesh(
  group: THREE.Group,
  color: number,
  belly: number,
  animal: string,
): void {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: belly, roughness: 0.7 });

  switch (animal) {
    case 'fox':       buildFox(group, mat, bellyMat, color); break;
    case 'rabbit':    buildRabbit(group, mat, bellyMat, color); break;
    case 'deer':      buildDeer(group, mat, bellyMat, color); break;
    case 'frog':      buildFrog(group, mat, bellyMat, color); break;
    case 'owl':       buildOwl(group, mat, bellyMat, color); break;
    case 'snake':     buildSnake(group, mat, bellyMat, color); break;
    case 'chameleon':
    default:          buildChameleon(group, mat, bellyMat, color); break;
  }
}

// ── Fox ─────────────────────────────────────────────────────

function buildFox(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.6);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), mat);
  torso.scale.set(0.9, 1.1, 0.85);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), bellyMat);
  bel.position.set(0, -0.1, 0.18);
  bel.scale.set(0.85, 0.9, 0.5);
  bodyPivot.add(bel);

  // Head pivot (1.35 - 0.6 = 0.75 relative)
  const headPivot = createHeadPivot(bodyPivot, 0.75);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat);
  head.castShadow = true;
  headPivot.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), bellyMat);
  snout.position.set(0, -0.1, 0.36);
  snout.scale.set(1, 0.65, 0.8);
  headPivot.add(snout);

  attachNose(headPivot, -0.07, 0.5, 0x222222);
  attachCozyEyes(headPivot, 0.07, 0.34, 0.16, 0.08);
  attachBlush(headPivot, -0.07, 0.32, 0.26);

  const earGeo = new THREE.ConeGeometry(0.13, 0.35, 4);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.28, 0.43, -0.04);
    ear.rotation.z = side * 0.2;
    headPivot.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), bellyMat);
    inner.position.set(side * 0.28, 0.41, 0.0);
    inner.rotation.z = side * 0.2;
    headPivot.add(inner);
  }

  const tailPivot = createTailPivot(bodyPivot, -0.05, -0.48);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), mat);
  tail.scale.set(0.7, 1.0, 1.3);
  tailPivot.add(tail);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), bellyMat);
  tailTip.name = PART_NAMES.tailTip;
  tailTip.position.set(0, 0, -0.22);
  tailPivot.add(tailTip);

  attachLegs(g, color, 0.16, 0.18);
}

// ── Rabbit ──────────────────────────────────────────────────

function buildRabbit(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.6);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat);
  torso.scale.set(0.9, 1.0, 0.9);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), bellyMat);
  bel.position.set(0, -0.1, 0.2);
  bel.scale.set(0.85, 0.9, 0.5);
  bodyPivot.add(bel);

  const headPivot = createHeadPivot(bodyPivot, 0.75);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 10, 8), mat);
  head.castShadow = true;
  headPivot.add(head);

  attachCozyEyes(headPivot, 0.07, 0.36, 0.17, 0.09);
  attachNose(headPivot, -0.05, 0.44, 0xf0a0a0);
  attachBlush(headPivot, -0.05, 0.34, 0.28);

  const earGeo = new THREE.CapsuleGeometry(0.08, 0.45, 4, 6);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.2, 0.55, -0.05);
    ear.rotation.z = side * 0.15;
    headPivot.add(ear);
    const inner = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04, 0.35, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0xf0a0a0 }),
    );
    inner.position.set(side * 0.2, 0.53, 0.02);
    inner.rotation.z = side * 0.15;
    headPivot.add(inner);
  }

  const tailPivot = createTailPivot(bodyPivot, -0.05, -0.42);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), bellyMat);
  tailPivot.add(tail);

  attachLegs(g, color, 0.18, 0.18);
}

// ── Deer ────────────────────────────────────────────────────

function buildDeer(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.7);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), mat);
  torso.scale.set(0.85, 1.25, 0.8);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), bellyMat);
  bel.position.set(0, -0.1, 0.18);
  bel.scale.set(0.8, 1.0, 0.5);
  bodyPivot.add(bel);

  const spotMat = new THREE.MeshStandardMaterial({ color: 0xe0cca8 });
  const spots = [[-0.15, 0.1, 0.2], [0.2, -0.05, 0.22], [-0.1, -0.15, -0.15], [0.15, 0.15, -0.1]];
  for (const [sx, sy, sz] of spots) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), spotMat);
    spot.position.set(sx, sy, sz);
    bodyPivot.add(spot);
  }

  const headPivot = createHeadPivot(bodyPivot, 0.8);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), mat);
  head.castShadow = true;
  headPivot.add(head);

  attachCozyEyes(headPivot, 0.06, 0.32, 0.16, 0.09);
  attachNose(headPivot, -0.06, 0.4, 0x4a3020);
  attachBlush(headPivot, -0.06, 0.3, 0.26);

  const antlerMat = new THREE.MeshStandardMaterial({ color: 0x6d4c30 });
  for (const side of [-1, 1]) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4), antlerMat);
    stem.position.set(side * 0.22, 0.45, -0.05);
    headPivot.add(stem);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 4), antlerMat);
    branch.position.set(side * 0.28, 0.6, -0.05);
    branch.rotation.z = side * 0.5;
    headPivot.add(branch);
  }

  const earGeo = new THREE.SphereGeometry(0.1, 6, 6);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.38, 0.12, -0.05);
    ear.scale.set(0.7, 1, 0.5);
    headPivot.add(ear);
  }

  const tailPivot = createTailPivot(bodyPivot, -0.05, -0.35);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), bellyMat);
  tailPivot.add(tail);

  attachLegs(g, color, 0.15, 0.25);
}

// ── Frog ────────────────────────────────────────────────────

function buildFrog(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.42);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 8), mat);
  torso.scale.set(1, 0.75, 0.9);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), bellyMat);
  bel.position.set(0, -0.07, 0.2);
  bel.scale.set(0.9, 0.7, 0.5);
  bodyPivot.add(bel);

  const headPivot = createHeadPivot(bodyPivot, 0.53);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), mat);
  headPivot.add(head);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.015, 4, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x4a7a4a }),
  );
  mouth.position.set(0, -0.1, 0.34);
  mouth.rotation.x = 0.2;
  headPivot.add(mouth);

  const bulgeGeo = new THREE.SphereGeometry(0.14, 8, 8);
  const bulgeMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e0 });
  for (const side of [-1, 1]) {
    const bulge = new THREE.Mesh(bulgeGeo, bulgeMat);
    bulge.position.set(side * 0.2, 0.27, 0.15);
    headPivot.add(bulge);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x222222 }),
    );
    pupil.position.set(side * 0.2, 0.27, 0.28);
    headPivot.add(pupil);
  }

  attachBlush(headPivot, -0.07, 0.3, 0.3);

  const legMat = new THREE.MeshStandardMaterial({ color });
  const legGeo = new THREE.SphereGeometry(0.14, 6, 6);
  const legNames = [PART_NAMES.leftLeg, PART_NAMES.rightLeg];
  let legIdx = 0;
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = legNames[legIdx++];
    pivot.position.set(side * 0.35, 0.18, 0);

    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(0, -0.06, 0.1);
    leg.scale.set(1, 0.6, 1.3);
    pivot.add(leg);

    g.add(pivot);
  }
}

// ── Owl ─────────────────────────────────────────────────────

function buildOwl(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.6);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat);
  torso.scale.set(1, 1.1, 0.9);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), bellyMat);
  bel.position.set(0, -0.05, 0.2);
  bel.scale.set(0.9, 1.0, 0.5);
  bodyPivot.add(bel);

  const headPivot = createHeadPivot(bodyPivot, 0.8);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 8), mat);
  head.castShadow = true;
  headPivot.add(head);

  const disc = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), bellyMat);
  disc.position.set(0, 0.02, 0.2);
  disc.scale.set(1, 0.9, 0.4);
  headPivot.add(disc);

  attachCozyEyes(headPivot, 0.08, 0.38, 0.18, 0.12);

  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.1, 4),
    new THREE.MeshStandardMaterial({ color: 0xd4a040 }),
  );
  beak.position.set(0, -0.04, 0.46);
  beak.rotation.x = Math.PI;
  headPivot.add(beak);

  const tuftGeo = new THREE.ConeGeometry(0.1, 0.25, 4);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const tuft = new THREE.Mesh(tuftGeo, mat);
    tuft.name = earNames[earIdx++];
    tuft.position.set(side * 0.28, 0.45, -0.08);
    tuft.rotation.z = side * 0.3;
    headPivot.add(tuft);
  }

  const wingNames = [PART_NAMES.leftWing, PART_NAMES.rightWing];
  let wingIdx = 0;
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), mat);
    wing.name = wingNames[wingIdx++];
    wing.position.set(side * 0.45, 0, -0.08);
    wing.scale.set(0.5, 1.2, 0.8);
    bodyPivot.add(wing);
  }

  attachFeetOnly(g, color, 0.14);
}

// ── Snake ───────────────────────────────────────────────────

function buildSnake(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, _color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.2);

  const coil1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.12, 6, 10, Math.PI * 1.5), mat,
  );
  coil1.rotation.x = -Math.PI / 2;
  coil1.castShadow = true;
  bodyPivot.add(coil1);

  const coil2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.1, 6, 10, Math.PI), mat,
  );
  coil2.position.set(0, 0.22, 0);
  coil2.rotation.x = -Math.PI / 2;
  coil2.rotation.z = Math.PI / 3;
  bodyPivot.add(coil2);

  const bellyStripe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), bellyMat);
  bellyStripe.position.set(0, -0.05, 0.15);
  bellyStripe.scale.set(1.5, 0.4, 1);
  bodyPivot.add(bellyStripe);

  const headPivot = createHeadPivot(bodyPivot, 0.6);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat);
  head.position.set(0, 0, 0.2);
  headPivot.add(head);

  attachCozyEyes(headPivot, 0.08, 0.42, 0.12, 0.07);
  attachNose(headPivot, -0.02, 0.48, 0x444444);
  attachBlush(headPivot, -0.02, 0.38, 0.2);

  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.01, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xe05050 }),
  );
  tongue.position.set(0, -0.05, 0.52);
  headPivot.add(tongue);

  const tailPivot = createTailPivot(bodyPivot, -0.05, -0.15);
  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), mat);
  tailTip.position.set(0.25, 0, 0);
  tailTip.rotation.z = Math.PI / 2;
  tailPivot.add(tailTip);
}

// ── Chameleon ───────────────────────────────────────────────

function buildChameleon(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.55);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), mat);
  torso.scale.set(0.85, 1, 1.1);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), bellyMat);
  bel.position.set(0, -0.1, 0.18);
  bel.scale.set(0.8, 0.85, 0.5);
  bodyPivot.add(bel);

  const headPivot = createHeadPivot(bodyPivot, 0.65);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), mat);
  headPivot.add(head);

  const casque = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 6), mat);
  casque.position.set(0, 0.35, -0.1);
  headPivot.add(casque);

  const eyeMount = new THREE.MeshStandardMaterial({ color });
  for (const side of [-1, 1]) {
    const mount = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), eyeMount);
    mount.position.set(side * 0.3, 0.1, 0.2);
    headPivot.add(mount);
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xf8f8e8 }),
    );
    eyeWhite.position.set(side * 0.36, 0.1, 0.26);
    headPivot.add(eyeWhite);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x222222 }),
    );
    pupil.position.set(side * 0.38, 0.1, 0.32);
    headPivot.add(pupil);
  }

  attachNose(headPivot, -0.06, 0.36, 0x444444);

  const tailPivot = createTailPivot(bodyPivot, -0.15, -0.55, 0.3);
  const tail = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.05, 6, 12, Math.PI * 1.4), mat,
  );
  tail.rotation.y = Math.PI;
  tailPivot.add(tail);

  attachLegs(g, color, 0.22, 0.15);
}
