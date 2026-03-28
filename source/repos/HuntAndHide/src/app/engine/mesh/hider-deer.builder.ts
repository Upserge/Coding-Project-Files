import * as THREE from 'three';
import {
  PART_NAMES, createBodyPivot, createHeadPivot, createTailPivot,
  attachCozyEyes, attachNose, attachBlush, attachLegs,
} from './mesh-helpers';
import { createStandardPart } from './character-material.factory';
import { attachAntler } from './hider-accent-helpers';

export function buildDeer(
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
