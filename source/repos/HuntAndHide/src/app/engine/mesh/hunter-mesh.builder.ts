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
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: belly, roughness: 0.7 });

  // Body pivot at y=0.65
  const bodyPivot = createBodyPivot(group, 0.65);

  // Torso (local y=0)
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), mat);
  torso.scale.set(1, 1.15, 0.9);
  torso.castShadow = true;
  bodyPivot.add(torso);

  // Belly patch (body=0.65, belly was at 0.55 -> local -0.1)
  const bellyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bellyMat);
  bellyMesh.position.set(0, -0.1, 0.22);
  bellyMesh.scale.set(0.9, 1, 0.5);
  bodyPivot.add(bellyMesh);

  // Head pivot (head was at 1.45, body=0.65 -> rel 0.8)
  const headPivot = createHeadPivot(bodyPivot, 0.8);

  // Head mesh (local y=0)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 8), mat);
  head.castShadow = true;
  headPivot.add(head);

  // Snout (was y=1.35, head=1.45 -> local -0.1)
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), bellyMat);
  snout.position.set(0, -0.1, 0.4);
  snout.scale.set(1, 0.7, 0.8);
  headPivot.add(snout);

  // Nose (was y=1.38, head=1.45 -> local -0.07)
  attachNose(headPivot, -0.07, 0.56, 0x333333);
  // Eyes (was y=1.52, head=1.45 -> local 0.07)
  attachCozyEyes(headPivot, 0.07, 0.38, 0.18, 0.09);
  // Blush (was y=1.38, head=1.45 -> local -0.07)
  attachBlush(headPivot, -0.07, 0.36, 0.3);

  // Pointed ears (was y=1.9, head=1.45 -> local 0.45)
  const earGeo = new THREE.ConeGeometry(0.14, 0.32, 4);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.3, 0.45, -0.05);
    ear.rotation.z = side * 0.25;
    headPivot.add(ear);
    const innerGeo = new THREE.ConeGeometry(0.07, 0.18, 4);
    const inner = new THREE.Mesh(innerGeo, new THREE.MeshStandardMaterial({ color: 0xf0a0a0 }));
    inner.position.set(side * 0.3, 0.43, 0.0);
    inner.rotation.z = side * 0.25;
    headPivot.add(inner);
  }

  // Tail (per animal, attached to bodyPivot)
  attachHunterTail(bodyPivot, mat, animal);

  // Arms (was y=0.75, body=0.65 -> local 0.1)
  const armGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const armNames = [PART_NAMES.leftArm, PART_NAMES.rightArm];
  let armIdx = 0;
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, mat);
    arm.name = armNames[armIdx++];
    arm.position.set(side * 0.42, 0.1, 0.15);
    arm.scale.set(0.8, 1.2, 0.8);
    bodyPivot.add(arm);
  }

  // Legs at root level (pivot groups with feet inside)
  attachLegs(group, color, 0.2, 0.22);
}

function attachHunterTail(
  bodyPivot: THREE.Group,
  mat: THREE.MeshStandardMaterial,
  animal: string,
): void {
  switch (animal) {
    case 'wolf': {
      // Was at (0, 0.55, -0.45), body=0.65 -> rel (-0.1, -0.45), droop -0.7
      const tailPivot = createTailPivot(bodyPivot, -0.1, -0.45, -0.7);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.5, 6), mat);
      tailPivot.add(tail);
      break;
    }
    case 'lion': {
      // Was at (0, 0.6, -0.48), body=0.65 -> rel (-0.05, -0.48), droop -0.5
      const tailPivot = createTailPivot(bodyPivot, -0.05, -0.48, -0.5);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6), mat);
      tailPivot.add(tail);
      // Poof tip
      const poof = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xb08020 }),
      );
      poof.name = PART_NAMES.tailTip;
      poof.position.set(0, -0.22, -0.22);
      tailPivot.add(poof);
      // Mane (same Y as headPivot inside bodyPivot)
      const mane = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.12, 6, 10),
        new THREE.MeshStandardMaterial({ color: 0xb08020, roughness: 0.9 }),
      );
      mane.position.set(0, 0.8, 0);
      mane.rotation.x = Math.PI / 2;
      bodyPivot.add(mane);
      break;
    }
    case 'panther':
    default: {
      // Was at (0, 0.55, -0.5), body=0.65 -> rel (-0.1, -0.5), droop -0.45
      const tailPivot = createTailPivot(bodyPivot, -0.1, -0.5, -0.45);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.6, 6), mat);
      tailPivot.add(tail);
      const curl = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.03, 4, 8, Math.PI),
        mat,
      );
      curl.name = PART_NAMES.tailTip;
      curl.position.set(0, -0.2, -0.25);
      tailPivot.add(curl);
      break;
    }
  }
}
