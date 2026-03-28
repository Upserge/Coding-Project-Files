import * as THREE from 'three';
import {
  PART_NAMES, createBodyPivot, createHeadPivot, createTailPivot,
  attachCozyEyes, attachNose, attachBlush, attachLegs,
} from './mesh-helpers';
import { createSurfaceMatcap } from './character-material.factory';
import { attachWhiskers } from './hider-accent-helpers';

export function buildRabbit(
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
