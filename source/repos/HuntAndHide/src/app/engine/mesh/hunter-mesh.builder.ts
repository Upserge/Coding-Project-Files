import * as THREE from 'three';
import { PART_NAMES, attachCozyEyes, attachNose, attachBlush, attachLegs, attachFeet } from './mesh-helpers';

/**
 * Builds a shared chibi predator body (wolf / lion / panther).
 * All hunters share a similar silhouette for readability per project guidelines,
 * differentiated by colour, tail shape, and mane.
 */
export function buildHunterMesh(
  group: THREE.Group,
  color: number,
  belly: number,
  animal: string,
): void {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: belly, roughness: 0.7 });

  // Stubby bean body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), mat);
  body.name = PART_NAMES.body;
  body.position.y = 0.65;
  body.scale.set(1, 1.15, 0.9);
  body.castShadow = true;
  group.add(body);

  // Belly patch
  const bellyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bellyMat);
  bellyMesh.position.set(0, 0.55, 0.22);
  bellyMesh.scale.set(0.9, 1, 0.5);
  group.add(bellyMesh);

  // Big round head (chibi)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 8), mat);
  head.name = PART_NAMES.head;
  head.position.y = 1.45;
  head.castShadow = true;
  group.add(head);

  // Snout bump
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), bellyMat);
  snout.position.set(0, 1.35, 0.4);
  snout.scale.set(1, 0.7, 0.8);
  group.add(snout);

  attachNose(group, 1.38, 0.56, 0x333333);
  attachCozyEyes(group, 1.52, 0.38, 0.18, 0.09);
  attachBlush(group, 1.38, 0.36, 0.3);

  // Pointed ears (triangular, all hunters share this shape)
  const earGeo = new THREE.ConeGeometry(0.14, 0.32, 4);
  const earNames = [PART_NAMES.leftEar, PART_NAMES.rightEar];
  let earIdx = 0;
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.name = earNames[earIdx++];
    ear.position.set(side * 0.3, 1.9, -0.05);
    ear.rotation.z = side * 0.25;
    group.add(ear);
    const innerGeo = new THREE.ConeGeometry(0.07, 0.18, 4);
    const inner = new THREE.Mesh(innerGeo, new THREE.MeshStandardMaterial({ color: 0xf0a0a0 }));
    inner.position.set(side * 0.3, 1.88, 0.0);
    inner.rotation.z = side * 0.25;
    group.add(inner);
  }

  // Tail (differs slightly per hunter animal)
  attachHunterTail(group, mat, animal);

  // Stubby arms
  const armGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const armNames = [PART_NAMES.leftArm, PART_NAMES.rightArm];
  let armIdx = 0;
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, mat);
    arm.name = armNames[armIdx++];
    arm.position.set(side * 0.42, 0.75, 0.15);
    arm.scale.set(0.8, 1.2, 0.8);
    group.add(arm);
  }

  attachLegs(group, color, 0.2, 0.22);
  attachFeet(group, color, 0.2);
}

function attachHunterTail(
  group: THREE.Group,
  mat: THREE.MeshStandardMaterial,
  animal: string,
): void {
  switch (animal) {
    case 'wolf': {
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.5, 6), mat);
      tail.name = PART_NAMES.tail;
      tail.position.set(0, 0.55, -0.45);
      tail.rotation.x = -0.7;
      group.add(tail);
      break;
    }
    case 'lion': {
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6), mat);
      tail.name = PART_NAMES.tail;
      tail.position.set(0, 0.6, -0.48);
      tail.rotation.x = -0.5;
      group.add(tail);
      const poof = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xb08020 }),
      );
      poof.name = PART_NAMES.tailTip;
      poof.position.set(0, 0.38, -0.7);
      group.add(poof);
      // Mane (ring of fluff around head)
      const mane = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.12, 6, 10),
        new THREE.MeshStandardMaterial({ color: 0xb08020, roughness: 0.9 }),
      );
      mane.position.set(0, 1.45, 0);
      mane.rotation.x = Math.PI / 2;
      group.add(mane);
      break;
    }
    case 'panther':
    default: {
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.6, 6), mat);
      tail.name = PART_NAMES.tail;
      tail.position.set(0, 0.55, -0.5);
      tail.rotation.x = -0.45;
      group.add(tail);
      const curl = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.03, 4, 8, Math.PI),
        mat,
      );
      curl.name = PART_NAMES.tailTip;
      curl.position.set(0, 0.35, -0.75);
      group.add(curl);
      break;
    }
  }
}
