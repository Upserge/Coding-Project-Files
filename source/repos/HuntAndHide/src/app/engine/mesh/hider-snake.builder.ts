import * as THREE from 'three';
import {
  createBodyPivot, createHeadPivot, createTailPivot,
  attachCozyEyes, attachNose, attachBlush,
} from './mesh-helpers';
import { createStandardPart } from './character-material.factory';
import { attachScaleRidges } from './hider-accent-helpers';

export function buildSnake(
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
