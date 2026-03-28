import * as THREE from 'three';
import {
  PART_NAMES, createBodyPivot, createHeadPivot, createTailPivot,
  attachCozyEyes, attachNose, attachBlush, attachLegs,
} from './mesh-helpers';
import { createSurfaceMatcap } from './character-material.factory';
import { attachWhiskers } from './hider-accent-helpers';

export function buildFox(
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

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 14), mat);
  head.castShadow = true;
  headPivot.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), bellyMat);
  snout.position.set(0, -0.1, 0.34);
  snout.scale.set(0.75, 0.55, 0.7);
  headPivot.add(snout);

  attachNose(headPivot, -0.1, 0.44, 0x222222);
  attachCozyEyes(headPivot, 0.07, 0.34, 0.16, 0.08);
  attachBlush(headPivot, -0.08, 0.32, 0.24);
  attachWhiskers(headPivot, -0.08, 0.4);

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
