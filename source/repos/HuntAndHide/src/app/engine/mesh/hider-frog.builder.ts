import * as THREE from 'three';
import {
  PART_NAMES, createBodyPivot, createHeadPivot,
  attachBlush,
} from './mesh-helpers';
import { createSurfaceMatcap, createStandardPart } from './character-material.factory';
import { attachFrogSpots } from './hider-accent-helpers';

export function buildFrog(
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
