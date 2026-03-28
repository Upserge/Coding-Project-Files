import * as THREE from 'three';
import {
  PART_NAMES, createBodyPivot, createHeadPivot, createTailPivot,
  attachCozyEyes, attachBlush, attachLegs,
} from './mesh-helpers';
import { createStandardPart } from './character-material.factory';

export function buildPig(
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
