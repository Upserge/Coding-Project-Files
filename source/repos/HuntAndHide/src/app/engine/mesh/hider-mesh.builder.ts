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
import { createBodyMatcap, createSurfaceMatcap, createStandardPart } from './character-material.factory';

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
  const mat = createBodyMatcap(color);
  const bellyMat = createSurfaceMatcap(belly);
  const buildAnimal = HIDER_BUILDERS[animal] ?? buildChameleon;
  buildAnimal(group, mat, bellyMat, color);
}

const HIDER_BUILDERS: Record<string, typeof buildFox> = {
  fox: buildFox,
  rabbit: buildRabbit,
  deer: buildDeer,
  frog: buildFrog,
  owl: buildOwl,
  snake: buildSnake,
  pig: buildPig,
  chameleon: buildChameleon,
};

// ── Fox ─────────────────────────────────────────────────────

function buildFox(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.6);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), mat);
  torso.scale.set(0.9, 1.1, 0.85);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 14), bellyMat);
  bel.position.set(0, -0.1, 0.18);
  bel.scale.set(0.85, 0.9, 0.5);
  bodyPivot.add(bel);

  const headPivot = createHeadPivot(bodyPivot, 0.75);

  // Single round head sphere
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 14), mat);
  head.castShadow = true;
  headPivot.add(head);

  // Small snout tucked into the head so it reads as one shape
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), bellyMat);
  snout.position.set(0, -0.1, 0.34);
  snout.scale.set(0.75, 0.55, 0.7);
  headPivot.add(snout);

  attachNose(headPivot, -0.1, 0.44, 0x222222);
  attachCozyEyes(headPivot, 0.07, 0.34, 0.16, 0.08);
  attachBlush(headPivot, -0.08, 0.32, 0.24);
  attachWhiskers(headPivot, -0.08, 0.4);

  // Tall, pointed fox ears
  const earGeo = new THREE.ConeGeometry(0.14, 0.44, 8);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.24, 0.45, -0.08);
    ear.rotation.z = side * 0.15;
    headPivot.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 8), bellyMat);
    inner.position.set(side * 0.24, 0.44, -0.04);
    inner.rotation.z = side * 0.15;
    headPivot.add(inner);
  }

  const tailPivot = createTailPivot(bodyPivot, -0.05, -0.48);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), mat);
  tail.scale.set(0.7, 1.0, 1.3);
  tailPivot.add(tail);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), bellyMat);
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

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), mat);
  torso.scale.set(0.9, 1.0, 0.9);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), bellyMat);
  bel.position.set(0, -0.1, 0.2);
  bel.scale.set(0.85, 0.9, 0.5);
  bodyPivot.add(bel);

  const headPivot = createHeadPivot(bodyPivot, 0.75);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 14), mat);
  head.castShadow = true;
  headPivot.add(head);

  attachCozyEyes(headPivot, 0.07, 0.36, 0.17, 0.09);
  attachNose(headPivot, -0.05, 0.44, 0xf0a0a0);
  attachBlush(headPivot, -0.05, 0.34, 0.28);
  attachWhiskers(headPivot, -0.04, 0.42);

  const earGeo = new THREE.CapsuleGeometry(0.08, 0.45, 8, 12);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.2, 0.55, -0.05);
    ear.rotation.z = side * 0.15;
    headPivot.add(ear);
    const inner = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04, 0.35, 8, 12),
      createSurfaceMatcap(0xf0a0a0),
    );
    inner.position.set(side * 0.2, 0.53, 0.02);
    inner.rotation.z = side * 0.15;
    headPivot.add(inner);
  }

  const tailPivot = createTailPivot(bodyPivot, -0.05, -0.42);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), bellyMat);
  tailPivot.add(tail);

  attachLegs(g, color, 0.18, 0.18);
}

// ── Deer ────────────────────────────────────────────────────

function buildDeer(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.7);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), mat);
  torso.scale.set(0.85, 1.25, 0.8);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), bellyMat);
  bel.position.set(0, -0.1, 0.18);
  bel.scale.set(0.8, 1.0, 0.5);
  bodyPivot.add(bel);

  const spotMat = createStandardPart(0xe0cca8, 'matte');
  const spots = [
    [-0.15, 0.1, 0.2], [0.2, -0.05, 0.22],
    [-0.1, -0.15, -0.15], [0.15, 0.15, -0.1],
    [0.0, 0.2, 0.18], [-0.2, 0.0, -0.08],
  ];
  for (const [sx, sy, sz] of spots) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), spotMat);
    spot.position.set(sx, sy, sz);
    bodyPivot.add(spot);
  }

  const headPivot = createHeadPivot(bodyPivot, 0.8);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 14), mat);
  head.castShadow = true;
  headPivot.add(head);

  attachCozyEyes(headPivot, 0.06, 0.32, 0.16, 0.09);
  attachNose(headPivot, -0.06, 0.4, 0x4a3020);
  attachBlush(headPivot, -0.06, 0.3, 0.26);

  const antlerMat = createStandardPart(0x6d4c30, 'hard');
  for (const side of [-1, 1]) {
    attachAntler(headPivot, antlerMat, side);
  }

  const earGeo = new THREE.SphereGeometry(0.1, 12, 12);
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
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), bellyMat);
  tailPivot.add(tail);

  attachLegs(g, color, 0.15, 0.25);
}

// ── Frog ────────────────────────────────────────────────────

function buildFrog(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.42);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 14), mat);
  torso.scale.set(1, 0.75, 0.9);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), bellyMat);
  bel.position.set(0, -0.07, 0.2);
  bel.scale.set(0.9, 0.7, 0.5);
  bodyPivot.add(bel);

  attachFrogSpots(bodyPivot);

  const headPivot = createHeadPivot(bodyPivot, 0.53);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 14), mat);
  headPivot.add(head);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.015, 8, 16, Math.PI),
    createStandardPart(0x4a7a4a, 'matte'),
  );
  mouth.position.set(0, -0.1, 0.34);
  mouth.rotation.x = 0.2;
  headPivot.add(mouth);

  const bulgeGeo = new THREE.SphereGeometry(0.14, 14, 14);
  const bulgeMat = createStandardPart(0xf0f0e0, 'glossy');
  for (const side of [-1, 1]) {
    const bulge = new THREE.Mesh(bulgeGeo, bulgeMat);
    bulge.position.set(side * 0.2, 0.27, 0.15);
    headPivot.add(bulge);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      createStandardPart(0x222222, 'glossy'),
    );
    pupil.name = side < 0 ? 'pupil_L' : 'pupil_R';
    pupil.position.set(side * 0.2, 0.27, 0.28);
    headPivot.add(pupil);
  }

  attachBlush(headPivot, -0.07, 0.3, 0.3);

  const legMat = createSurfaceMatcap(color);
  const legGeo = new THREE.SphereGeometry(0.14, 12, 12);
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

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), mat);
  torso.scale.set(1, 1.1, 0.9);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), bellyMat);
  bel.position.set(0, -0.05, 0.2);
  bel.scale.set(0.9, 1.0, 0.5);
  bodyPivot.add(bel);

  attachFeatherTufts(bodyPivot, bellyMat);

  const headPivot = createHeadPivot(bodyPivot, 0.8);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 14), mat);
  head.castShadow = true;
  headPivot.add(head);

  const disc = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), bellyMat);
  disc.position.set(0, 0.02, 0.2);
  disc.scale.set(1, 0.9, 0.4);
  headPivot.add(disc);

  attachCozyEyes(headPivot, 0.08, 0.38, 0.18, 0.12);

  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.1, 8),
    createStandardPart(0xd4a040, 'hard'),
  );
  beak.position.set(0, -0.04, 0.46);
  beak.rotation.x = Math.PI;
  headPivot.add(beak);

  const tuftGeo = new THREE.ConeGeometry(0.1, 0.25, 8);
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
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), mat);
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
    new THREE.TorusGeometry(0.25, 0.12, 12, 16, Math.PI * 1.5), mat,
  );
  coil1.rotation.x = -Math.PI / 2;
  coil1.castShadow = true;
  bodyPivot.add(coil1);

  const coil2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.1, 12, 16, Math.PI), mat,
  );
  coil2.position.set(0, 0.22, 0);
  coil2.rotation.x = -Math.PI / 2;
  coil2.rotation.z = Math.PI / 3;
  bodyPivot.add(coil2);

  attachScaleRidges(bodyPivot, mat);

  const bellyStripe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), bellyMat);
  bellyStripe.position.set(0, -0.05, 0.15);
  bellyStripe.scale.set(1.5, 0.4, 1);
  bodyPivot.add(bellyStripe);

  const headPivot = createHeadPivot(bodyPivot, 0.6);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 14), mat);
  head.position.set(0, 0, 0.2);
  headPivot.add(head);

  attachCozyEyes(headPivot, 0.08, 0.42, 0.12, 0.07);
  attachNose(headPivot, -0.02, 0.48, 0x444444);
  attachBlush(headPivot, -0.02, 0.38, 0.2);

  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.01, 0.12),
    createStandardPart(0xe05050, 'glossy'),
  );
  tongue.position.set(0, -0.05, 0.52);
  headPivot.add(tongue);

  const tailPivot = createTailPivot(bodyPivot, -0.05, -0.15);
  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), mat);
  tailTip.position.set(0.25, 0, 0);
  tailTip.rotation.z = Math.PI / 2;
  tailPivot.add(tailTip);
}

// ── Chameleon ───────────────────────────────────────────────

function buildChameleon(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.55);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 14), mat);
  torso.scale.set(0.85, 1, 1.1);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 14), bellyMat);
  bel.position.set(0, -0.1, 0.18);
  bel.scale.set(0.8, 0.85, 0.5);
  bodyPivot.add(bel);

  const headPivot = createHeadPivot(bodyPivot, 0.65);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), mat);
  headPivot.add(head);

  const casque = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 8), mat);
  casque.position.set(0, 0.35, -0.1);
  headPivot.add(casque);

  const eyeMount = createSurfaceMatcap(color);
  for (const side of [-1, 1]) {
    const mount = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), eyeMount);
    mount.position.set(side * 0.3, 0.1, 0.2);
    headPivot.add(mount);
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      createStandardPart(0xf8f8e8, 'glossy'),
    );
    eyeWhite.position.set(side * 0.36, 0.1, 0.26);
    headPivot.add(eyeWhite);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      createStandardPart(0x222222, 'glossy'),
    );
    pupil.name = side < 0 ? 'pupil_L' : 'pupil_R';
    pupil.position.set(side * 0.38, 0.1, 0.32);
    headPivot.add(pupil);
  }

  attachNose(headPivot, -0.06, 0.36, 0x444444);

  const tailPivot = createTailPivot(bodyPivot, -0.15, -0.55, 0.3);
  const tail = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.05, 12, 16, Math.PI * 1.4), mat,
  );
  tail.rotation.y = Math.PI;
  tailPivot.add(tail);
  attachSpiralTip(tailPivot, mat);

  attachLegs(g, color, 0.22, 0.15);
}

// ── Pig ────────────────────────────────────────────────────

function buildPig(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const bodyPivot = createBodyPivot(g, 0.55);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 14), mat);
  torso.scale.set(1.1, 0.95, 1.0);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 14), bellyMat);
  bel.position.set(0, -0.12, 0.18);
  bel.scale.set(1.0, 0.85, 0.5);
  bodyPivot.add(bel);

  const headPivot = createHeadPivot(bodyPivot, 0.65);
  buildPigHead(headPivot, mat, bellyMat);

  const tailPivot = createTailPivot(bodyPivot, -0.05, -0.4);
  attachPigCurlyTail(tailPivot, mat);

  attachLegs(g, color, 0.2, 0.15);
}

function buildPigHead(
  headPivot: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material,
): void {
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 14), mat);
  head.castShadow = true;
  headPivot.add(head);

  attachPigSnout(headPivot, bellyMat);
  attachCozyEyes(headPivot, 0.06, 0.32, 0.16, 0.08);
  attachBlush(headPivot, -0.06, 0.3, 0.26);
  attachPigEars(headPivot, mat);
}

function attachPigSnout(
  headPivot: THREE.Group, bellyMat: THREE.Material,
): void {
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), bellyMat);
  snout.position.set(0, -0.06, 0.38);
  snout.rotation.x = Math.PI / 2;
  headPivot.add(snout);

  const nostrilMat = createStandardPart(0x444444, 'glossy');
  const nostrilGeo = new THREE.SphereGeometry(0.025, 8, 8);
  for (const side of [-1, 1]) {
    const nostril = new THREE.Mesh(nostrilGeo, nostrilMat);
    nostril.position.set(side * 0.05, -0.06, 0.43);
    headPivot.add(nostril);
  }
}

function attachPigEars(
  headPivot: THREE.Group, mat: THREE.Material,
): void {
  const earGeo = new THREE.SphereGeometry(0.1, 12, 12);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.28, 0.35, -0.02);
    ear.scale.set(0.7, 0.9, 0.5);
    ear.rotation.z = side * 0.3;
    ear.rotation.x = 0.4;
    headPivot.add(ear);
  }
}

function attachPigCurlyTail(
  tailPivot: THREE.Group, mat: THREE.Material,
): void {
  const curl = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.025, 8, 12, Math.PI * 1.5), mat,
  );
  curl.name = PART_NAMES.tailTip;
  curl.rotation.y = Math.PI / 2;
  tailPivot.add(curl);
}

// ── Accent detail helpers ──────────────────────────────────

const WHISKER_LEN = 0.18;
const WHISKER_MAT = new THREE.MeshStandardMaterial({ color: 0x444444 });

function attachWhiskers(head: THREE.Group, y: number, z: number): void {
  const geo = new THREE.CylinderGeometry(0.005, 0.005, WHISKER_LEN, 4);
  geo.rotateZ(Math.PI / 2);
  for (const side of [-1, 1]) {
    for (const vert of [-0.03, 0, 0.03]) {
      const w = new THREE.Mesh(geo, WHISKER_MAT);
      w.position.set(side * 0.22, y + vert, z);
      w.rotation.y = side * 0.2;
      head.add(w);
    }
  }
}

function attachAntler(
  head: THREE.Group, mat: THREE.Material, side: number,
): void {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), mat);
  stem.position.set(side * 0.22, 0.45, -0.05);
  head.add(stem);
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8), mat);
  branch.position.set(side * 0.28, 0.6, -0.05);
  branch.rotation.z = side * 0.5;
  head.add(branch);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6), mat);
  tip.position.set(side * 0.18, 0.62, 0.04);
  tip.rotation.z = side * -0.4;
  head.add(tip);
}

function attachFrogSpots(bodyPivot: THREE.Group): void {
  const spotMat = createStandardPart(0x4a8a4a, 'matte');
  const positions = [
    [0.12, 0.1, -0.15], [-0.15, 0.08, -0.12],
    [0.0, 0.15, -0.2], [0.18, -0.02, -0.1],
  ];
  for (const [x, y, z] of positions) {
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.05, 8), spotMat);
    spot.position.set(x, y, z);
    spot.lookAt(x, y, z - 1);
    bodyPivot.add(spot);
  }
}

function attachFeatherTufts(body: THREE.Group, mat: THREE.Material): void {
  const geo = new THREE.ConeGeometry(0.04, 0.12, 6);
  const positions = [
    [-0.08, -0.15, 0.3], [0.08, -0.15, 0.3],
    [0.0, -0.22, 0.28], [-0.12, -0.08, 0.32],
    [0.12, -0.08, 0.32],
  ];
  for (const [x, y, z] of positions) {
    const tuft = new THREE.Mesh(geo, mat);
    tuft.position.set(x, y, z);
    tuft.rotation.x = -0.3;
    body.add(tuft);
  }
}

function attachScaleRidges(body: THREE.Group, mat: THREE.Material): void {
  const geo = new THREE.TorusGeometry(0.06, 0.015, 6, 8, Math.PI);
  const offsets = [0.08, 0.16, 0.24];
  for (const dy of offsets) {
    const ridge = new THREE.Mesh(geo, mat);
    ridge.position.set(0, dy, -0.15);
    ridge.rotation.x = -Math.PI / 2;
    body.add(ridge);
  }
}

function attachSpiralTip(tailPivot: THREE.Group, mat: THREE.Material): void {
  const spiral = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.025, 8, 12, Math.PI * 1.2), mat,
  );
  spiral.position.set(0, -0.08, -0.18);
  spiral.rotation.x = Math.PI / 4;
  tailPivot.add(spiral);
}
