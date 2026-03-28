import * as THREE from 'three';
import {
  PART_NAMES, createBodyPivot, createHeadPivot,
  attachCozyEyes, attachFeetOnly,
} from './mesh-helpers';
import { createStandardPart } from './character-material.factory';
import { attachFeatherTufts } from './hider-accent-helpers';

export function buildOwl(
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
