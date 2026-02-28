import * as THREE from 'three';
import {
  PART_NAMES,
  attachCozyEyes,
  attachNose,
  attachBlush,
  attachLegs,
  attachFeet,
} from './mesh-helpers';

/**
 * Dispatches to the per-animal hider builder.
 * Each hider has a unique silhouette — fox, rabbit, deer, frog, owl, snake, chameleon.
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

/* ── Fox: slim chibi body, big fluffy tail, pointy ears ── */

function buildFox(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), mat);
  body.name = PART_NAMES.body;
  body.position.y = 0.6;
  body.scale.set(0.9, 1.1, 0.85);
  body.castShadow = true;
  g.add(body);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), bellyMat);
  bel.position.set(0, 0.5, 0.18);
  bel.scale.set(0.85, 0.9, 0.5);
  g.add(bel);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat);
  head.name = PART_NAMES.head;
  head.position.y = 1.35;
  head.castShadow = true;
  g.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), bellyMat);
  snout.position.set(0, 1.25, 0.36);
  snout.scale.set(1, 0.65, 0.8);
  g.add(snout);

  attachNose(g, 1.28, 0.5, 0x222222);
  attachCozyEyes(g, 1.42, 0.34, 0.16, 0.08);
  attachBlush(g, 1.28, 0.32, 0.26);

  const earGeo = new THREE.ConeGeometry(0.13, 0.35, 4);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.28, 1.78, -0.04);
    ear.rotation.z = side * 0.2;
    g.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), bellyMat);
    inner.position.set(side * 0.28, 1.76, 0.0);
    inner.rotation.z = side * 0.2;
    g.add(inner);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), mat);
  tail.name = PART_NAMES.tail;
  tail.position.set(0, 0.55, -0.48);
  tail.scale.set(0.7, 1.0, 1.3);
  g.add(tail);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), bellyMat);
  tailTip.name = PART_NAMES.tailTip;
  tailTip.position.set(0, 0.55, -0.7);
  g.add(tailTip);

  attachLegs(g, color, 0.16, 0.18);
  attachFeet(g, color, 0.16);
}

/* ── Rabbit: round chubby body, huge floppy ears, cotton tail ── */

function buildRabbit(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat);
  body.name = PART_NAMES.body;
  body.position.y = 0.6;
  body.scale.set(0.9, 1.0, 0.9);
  body.castShadow = true;
  g.add(body);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), bellyMat);
  bel.position.set(0, 0.5, 0.2);
  bel.scale.set(0.85, 0.9, 0.5);
  g.add(bel);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 10, 8), mat);
  head.name = PART_NAMES.head;
  head.position.y = 1.35;
  head.castShadow = true;
  g.add(head);

  attachCozyEyes(g, 1.42, 0.36, 0.17, 0.09);
  attachNose(g, 1.3, 0.44, 0xf0a0a0);
  attachBlush(g, 1.3, 0.34, 0.28);

  const earGeo = new THREE.CapsuleGeometry(0.08, 0.45, 4, 6);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.2, 1.9, -0.05);
    ear.rotation.z = side * 0.15;
    g.add(ear);
    const inner = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.04, 0.35, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0xf0a0a0 }),
    );
    inner.position.set(side * 0.2, 1.88, 0.02);
    inner.rotation.z = side * 0.15;
    g.add(inner);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), bellyMat);
  tail.name = PART_NAMES.tail;
  tail.position.set(0, 0.55, -0.42);
  g.add(tail);

  attachLegs(g, color, 0.18, 0.18);
  attachFeet(g, color, 0.18);
}

/* ── Deer: elegant with tiny antlers and white spots ── */

function buildDeer(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), mat);
  body.name = PART_NAMES.body;
  body.position.y = 0.7;
  body.scale.set(0.85, 1.25, 0.8);
  body.castShadow = true;
  g.add(body);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), bellyMat);
  bel.position.set(0, 0.6, 0.18);
  bel.scale.set(0.8, 1.0, 0.5);
  g.add(bel);

  const spotMat = new THREE.MeshStandardMaterial({ color: 0xe0cca8 });
  const spots = [[-0.15, 0.8, 0.2], [0.2, 0.65, 0.22], [-0.1, 0.55, -0.15], [0.15, 0.85, -0.1]];
  for (const [sx, sy, sz] of spots) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), spotMat);
    spot.position.set(sx, sy, sz);
    g.add(spot);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), mat);
  head.name = PART_NAMES.head;
  head.position.y = 1.5;
  head.castShadow = true;
  g.add(head);

  attachCozyEyes(g, 1.56, 0.32, 0.16, 0.09);
  attachNose(g, 1.44, 0.4, 0x4a3020);
  attachBlush(g, 1.44, 0.3, 0.26);

  const antlerMat = new THREE.MeshStandardMaterial({ color: 0x6d4c30 });
  for (const side of [-1, 1]) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4), antlerMat);
    stem.position.set(side * 0.22, 1.95, -0.05);
    g.add(stem);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 4), antlerMat);
    branch.position.set(side * 0.28, 2.1, -0.05);
    branch.rotation.z = side * 0.5;
    g.add(branch);
  }

  const earGeo = new THREE.SphereGeometry(0.1, 6, 6);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.38, 1.62, -0.05);
    ear.scale.set(0.7, 1, 0.5);
    g.add(ear);
  }

  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), bellyMat);
  tail.name = PART_NAMES.tail;
  tail.position.set(0, 0.65, -0.35);
  g.add(tail);

  attachLegs(g, color, 0.15, 0.25);
  attachFeet(g, color, 0.15);
}

/* ── Frog: squat and round, huge eyes on top ── */

function buildFrog(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 8), mat);
  body.name = PART_NAMES.body;
  body.position.y = 0.42;
  body.scale.set(1, 0.75, 0.9);
  body.castShadow = true;
  g.add(body);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), bellyMat);
  bel.position.set(0, 0.35, 0.2);
  bel.scale.set(0.9, 0.7, 0.5);
  g.add(bel);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), mat);
  head.name = PART_NAMES.head;
  head.position.y = 0.95;
  g.add(head);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.015, 4, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x4a7a4a }),
  );
  mouth.position.set(0, 0.85, 0.34);
  mouth.rotation.x = 0.2;
  g.add(mouth);

  const bulgeGeo = new THREE.SphereGeometry(0.14, 8, 8);
  const bulgeMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e0 });
  for (const side of [-1, 1]) {
    const bulge = new THREE.Mesh(bulgeGeo, bulgeMat);
    bulge.position.set(side * 0.2, 1.22, 0.15);
    g.add(bulge);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x222222 }),
    );
    pupil.position.set(side * 0.2, 1.22, 0.28);
    g.add(pupil);
  }

  attachBlush(g, 0.88, 0.3, 0.3);

  const legMat = new THREE.MeshStandardMaterial({
    color: (mat as THREE.MeshStandardMaterial).color.getHex(),
  });
  const legGeo = new THREE.SphereGeometry(0.14, 6, 6);
  const legNames = [PART_NAMES.leftLeg, PART_NAMES.rightLeg];
  let legIdx = 0;
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.name = legNames[legIdx++];
    leg.position.set(side * 0.35, 0.12, 0.1);
    leg.scale.set(1, 0.6, 1.3);
    g.add(leg);
  }
}

/* ── Owl: fluffy round, big eyes, tiny beak, wing tufts ── */

function buildOwl(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat);
  body.name = PART_NAMES.body;
  body.position.y = 0.6;
  body.scale.set(1, 1.1, 0.9);
  body.castShadow = true;
  g.add(body);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), bellyMat);
  bel.position.set(0, 0.55, 0.2);
  bel.scale.set(0.9, 1.0, 0.5);
  g.add(bel);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 8), mat);
  head.name = PART_NAMES.head;
  head.position.y = 1.4;
  head.castShadow = true;
  g.add(head);

  const disc = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), bellyMat);
  disc.position.set(0, 1.42, 0.2);
  disc.scale.set(1, 0.9, 0.4);
  g.add(disc);

  attachCozyEyes(g, 1.48, 0.38, 0.18, 0.12);

  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.1, 4),
    new THREE.MeshStandardMaterial({ color: 0xd4a040 }),
  );
  beak.position.set(0, 1.36, 0.46);
  beak.rotation.x = Math.PI;
  g.add(beak);

  const tuftGeo = new THREE.ConeGeometry(0.1, 0.25, 4);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const tuft = new THREE.Mesh(tuftGeo, mat);
    tuft.name = earNames[earIdx++];
    tuft.position.set(side * 0.28, 1.85, -0.08);
    tuft.rotation.z = side * 0.3;
    g.add(tuft);
  }

  const wingNames = [PART_NAMES.leftWing, PART_NAMES.rightWing];
  let wingIdx = 0;
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), mat);
    wing.name = wingNames[wingIdx++];
    wing.position.set(side * 0.45, 0.6, -0.08);
    wing.scale.set(0.5, 1.2, 0.8);
    g.add(wing);
  }

  attachFeet(g, color, 0.14);
}

/* ── Snake: long cute noodle with chibi face ── */

function buildSnake(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, _color: number,
): void {
  const coil1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.12, 6, 10, Math.PI * 1.5), mat,
  );
  coil1.name = PART_NAMES.body;
  coil1.position.set(0, 0.2, 0);
  coil1.rotation.x = -Math.PI / 2;
  coil1.castShadow = true;
  g.add(coil1);

  const coil2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.1, 6, 10, Math.PI), mat,
  );
  coil2.position.set(0, 0.42, 0);
  coil2.rotation.x = -Math.PI / 2;
  coil2.rotation.z = Math.PI / 3;
  g.add(coil2);

  const bellyStripe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), bellyMat);
  bellyStripe.position.set(0, 0.15, 0.15);
  bellyStripe.scale.set(1.5, 0.4, 1);
  g.add(bellyStripe);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat);
  head.name = PART_NAMES.head;
  head.position.set(0, 0.8, 0.2);
  g.add(head);

  attachCozyEyes(g, 0.88, 0.42, 0.12, 0.07);
  attachNose(g, 0.78, 0.48, 0x444444);
  attachBlush(g, 0.78, 0.38, 0.2);

  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.01, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xe05050 }),
  );
  tongue.position.set(0, 0.75, 0.52);
  g.add(tongue);

  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), mat);
  tailTip.name = PART_NAMES.tail;
  tailTip.position.set(0.25, 0.15, -0.15);
  tailTip.rotation.z = Math.PI / 2;
  g.add(tailTip);
}

/* ── Chameleon: round body, curled tail, cone casque, big rotating eyes ── */

function buildChameleon(
  g: THREE.Group, mat: THREE.Material, bellyMat: THREE.Material, color: number,
): void {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), mat);
  body.name = PART_NAMES.body;
  body.position.y = 0.55;
  body.scale.set(0.85, 1, 1.1);
  body.castShadow = true;
  g.add(body);

  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), bellyMat);
  bel.position.set(0, 0.45, 0.18);
  bel.scale.set(0.8, 0.85, 0.5);
  g.add(bel);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), mat);
  head.name = PART_NAMES.head;
  head.position.y = 1.2;
  g.add(head);

  const casque = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 6), mat);
  casque.position.set(0, 1.55, -0.1);
  g.add(casque);

  const eyeMount = new THREE.MeshStandardMaterial({
    color: (mat as THREE.MeshStandardMaterial).color.getHex(),
  });
  for (const side of [-1, 1]) {
    const mount = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), eyeMount);
    mount.position.set(side * 0.3, 1.3, 0.2);
    g.add(mount);
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xf8f8e8 }),
    );
    eyeWhite.position.set(side * 0.36, 1.3, 0.26);
    g.add(eyeWhite);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x222222 }),
    );
    pupil.position.set(side * 0.38, 1.3, 0.32);
    g.add(pupil);
  }

  attachNose(g, 1.14, 0.36, 0x444444);

  const tail = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.05, 6, 12, Math.PI * 1.4), mat,
  );
  tail.name = PART_NAMES.tail;
  tail.position.set(0, 0.4, -0.55);
  tail.rotation.y = Math.PI;
  tail.rotation.x = 0.3;
  g.add(tail);

  attachLegs(g, color, 0.22, 0.15);
  attachFeet(g, color, 0.22);
}
