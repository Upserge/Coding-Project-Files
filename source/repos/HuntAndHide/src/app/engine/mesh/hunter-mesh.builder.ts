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
} from './mesh-helpers';
import { createBodyMatcap, createSurfaceMatcap, createStandardPart } from './character-material.factory';

/**
 * Builds a shared chibi predator body (wolf / lion / panther).
 * All hunters share a similar silhouette for readability per project guidelines,
 * differentiated by colour, tail shape, and mane.
 *
 * Uses skeletal hierarchy: root -> bodyPivot -> headPivot / arms / tailPivot
 */
export function buildHunterMesh(
  group: THREE.Group,
  color: number,
  belly: number,
  animal: string,
): void {
  const mat = createBodyMatcap(color);
  const bellyMat = createSurfaceMatcap(belly);

  const bodyPivot = createBodyPivot(group, 0.65);

  // Per-animal body proportions — similar silhouette, different build
  const { torsoScale, headScale, earScale, armScale } = getHunterProportions(animal);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 14), mat);
  torso.scale.set(torsoScale.x, torsoScale.y, torsoScale.z);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const bellyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 14), bellyMat);
  bellyMesh.position.set(0, -0.1, 0.22);
  bellyMesh.scale.set(0.9, 1, 0.5);
  bodyPivot.add(bellyMesh);

  const headPivot = createHeadPivot(bodyPivot, 0.8);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 14), mat);
  head.scale.set(headScale.x, headScale.y, headScale.z);
  head.castShadow = true;
  headPivot.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), bellyMat);
  snout.position.set(0, -0.1, 0.4);
  snout.scale.set(1, 0.7, 0.8);
  headPivot.add(snout);

  attachNose(headPivot, -0.07, 0.56, 0x333333);
  attachCozyEyes(headPivot, 0.07, 0.38, 0.18, 0.09);
  attachBlush(headPivot, -0.07, 0.36, 0.3);
  attachFangs(headPivot);

  const earGeo = new THREE.ConeGeometry(0.14 * earScale, 0.32 * earScale, 8);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.3, 0.45, -0.05);
    ear.rotation.z = side * 0.25;
    headPivot.add(ear);
    const innerGeo = new THREE.ConeGeometry(0.07 * earScale, 0.18 * earScale, 8);
    const inner = new THREE.Mesh(innerGeo, createSurfaceMatcap(0xf0a0a0));
    inner.position.set(side * 0.3, 0.43, 0.0);
    inner.rotation.z = side * 0.25;
    headPivot.add(inner);
  }

  attachHunterTail(bodyPivot, mat, animal);
  attachAnimalAccent(bodyPivot, animal);

  const armGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const armNames = [PART_NAMES.leftArm, PART_NAMES.rightArm];
  let armIdx = 0;
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, mat);
    arm.name = armNames[armIdx++];
    arm.position.set(side * 0.42, 0.1, 0.15);
    arm.scale.set(armScale.x, armScale.y, armScale.z);
    bodyPivot.add(arm);
  }

  attachLegs(group, color, 0.2, 0.22);
}

/** Per-animal proportion tweaks — keeps the shared silhouette readable. */
function getHunterProportions(animal: string): {
  torsoScale: { x: number; y: number; z: number };
  headScale: { x: number; y: number; z: number };
  earScale: number;
  armScale: { x: number; y: number; z: number };
} {
  switch (animal) {
    case 'wolf':
      // Leaner, taller build — narrow shoulders, upright
      return {
        torsoScale: { x: 0.9, y: 1.25, z: 0.85 },
        headScale:  { x: 0.95, y: 1.0, z: 1.05 },
        earScale: 1.15,
        armScale: { x: 0.7, y: 1.3, z: 0.7 },
      };
    case 'lion':
      // Stockier, broader build — wide chest, rounder
      return {
        torsoScale: { x: 1.15, y: 1.05, z: 0.95 },
        headScale:  { x: 1.1, y: 1.0, z: 0.95 },
        earScale: 0.85,
        armScale: { x: 0.95, y: 1.1, z: 0.95 },
      };
    case 'panther':
    default:
      // Sleeker, elongated build — longer body, slim
      return {
        torsoScale: { x: 0.92, y: 1.12, z: 1.05 },
        headScale:  { x: 0.95, y: 0.95, z: 1.08 },
        earScale: 1.0,
        armScale: { x: 0.75, y: 1.2, z: 0.8 },
      };
  }
}

function attachHunterTail(
  bodyPivot: THREE.Group,
  mat: THREE.Material,
  animal: string,
): void {
  switch (animal) {
    case 'wolf': {
      const tailPivot = createTailPivot(bodyPivot, -0.1, -0.45, -0.7);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.5, 12), mat);
      tailPivot.add(tail);
      break;
    }
    case 'lion': {
      const tailPivot = createTailPivot(bodyPivot, -0.05, -0.48, -0.5);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 12), mat);
      tailPivot.add(tail);
      const poof = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 12),
        createSurfaceMatcap(0xb08020),
      );
      poof.name = PART_NAMES.tailTip;
      poof.position.set(0, -0.22, -0.22);
      tailPivot.add(poof);
      const mane = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.12, 12, 16),
        createSurfaceMatcap(0xb08020),
      );
      mane.position.set(0, 0.8, 0);
      mane.rotation.x = Math.PI / 2;
      bodyPivot.add(mane);
      break;
    }
    case 'panther':
    default: {
      const tailPivot = createTailPivot(bodyPivot, -0.1, -0.5, -0.45);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.6, 12), mat);
      tailPivot.add(tail);
      const curl = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.03, 8, 12, Math.PI),
        mat,
      );
      curl.name = PART_NAMES.tailTip;
      curl.position.set(0, -0.2, -0.25);
      tailPivot.add(curl);
      break;
    }
  }
}

// ── Accent detail helpers ──────────────────────────────────

const FANG_MAT = createStandardPart(0xf0f0f0, 'hard');

function attachFangs(head: THREE.Group): void {
  const geo = new THREE.ConeGeometry(0.02, 0.07, 6);
  for (const side of [-1, 1]) {
    const fang = new THREE.Mesh(geo, FANG_MAT);
    fang.position.set(side * 0.06, -0.18, 0.46);
    fang.rotation.x = Math.PI;
    head.add(fang);
  }
}

function attachAnimalAccent(
  bodyPivot: THREE.Group, animal: string,
): void {
  switch (animal) {
    case 'lion':    attachLionChestTuft(bodyPivot); break;
    case 'panther': attachPantherSpots(bodyPivot);  break;
    default: break;
  }
}

function attachLionChestTuft(body: THREE.Group): void {
  const tuftMat = createSurfaceMatcap(0xc8982a);
  const geo = new THREE.SphereGeometry(0.08, 10, 10);
  const positions = [[0, -0.1, 0.35], [-0.1, -0.18, 0.32], [0.1, -0.18, 0.32]];
  for (const [x, y, z] of positions) {
    const tuft = new THREE.Mesh(geo, tuftMat);
    tuft.position.set(x, y, z);
    body.add(tuft);
  }
}

function attachPantherSpots(body: THREE.Group): void {
  const spotMat = createStandardPart(0x1a1a2e, 'matte');
  const positions = [
    [-0.2, 0.05, 0.1], [0.15, 0.12, -0.1],
    [-0.1, -0.1, -0.2], [0.2, -0.05, 0.15],
  ];
  for (const [x, y, z] of positions) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), spotMat);
    spot.position.set(x, y, z);
    body.add(spot);
  }
}
