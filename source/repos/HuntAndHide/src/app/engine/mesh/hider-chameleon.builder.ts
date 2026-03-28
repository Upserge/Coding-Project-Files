import * as THREE from 'three';
import {
  PART_NAMES, createBodyPivot, createHeadPivot, createTailPivot,
  attachCozyEyes, attachNose, attachBlush, attachLegs,
} from './mesh-helpers';
import { createSurfaceMatcap, createStandardPart } from './character-material.factory';
import { attachSpiralTip } from './hider-accent-helpers';

export function buildChameleon(
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
