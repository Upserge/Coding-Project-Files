import * as THREE from 'three';
import { createStandardPart } from './character-material.factory';

const WHISKER_LEN = 0.18;
const WHISKER_MAT = new THREE.MeshStandardMaterial({ color: 0x444444 });

export function attachWhiskers(head: THREE.Group, y: number, z: number): void {
  const geo = new THREE.CylinderGeometry(0.005, 0.005, WHISKER_LEN, 4);
  geo.rotateZ(Math.PI / 2);
  for (const side of [-1, 1]) {
    for (const vert of [-0.03, 0, 0.03]) {
      const w = new THREE.Mesh(geo, WHISKER_MAT);
      w.position.set(side * 0.22, y + vert, z);
      w.rotation.y = side * 0.2;
      head.add(w);
    }
  }
}

export function attachAntler(
  head: THREE.Group, mat: THREE.Material, side: number,
): void {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), mat);
  stem.position.set(side * 0.22, 0.45, -0.05);
  head.add(stem);
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8), mat);
  branch.position.set(side * 0.28, 0.6, -0.05);
  branch.rotation.z = side * 0.5;
  head.add(branch);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6), mat);
  tip.position.set(side * 0.18, 0.62, 0.04);
  tip.rotation.z = side * -0.4;
  head.add(tip);
}

export function attachFrogSpots(bodyPivot: THREE.Group): void {
  const spotMat = createStandardPart(0x4a8a4a, 'matte');
  const positions = [
    [0.12, 0.1, -0.15], [-0.15, 0.08, -0.12],
    [0.0, 0.15, -0.2], [0.18, -0.02, -0.1],
  ];
  for (const [x, y, z] of positions) {
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.05, 8), spotMat);
    spot.position.set(x, y, z);
    spot.lookAt(x, y, z - 1);
    bodyPivot.add(spot);
  }
}

export function attachFeatherTufts(body: THREE.Group, mat: THREE.Material): void {
  const geo = new THREE.ConeGeometry(0.04, 0.12, 6);
  const positions = [
    [-0.08, -0.15, 0.3], [0.08, -0.15, 0.3],
    [0.0, -0.22, 0.28], [-0.12, -0.08, 0.32],
    [0.12, -0.08, 0.32],
  ];
  for (const [x, y, z] of positions) {
    const tuft = new THREE.Mesh(geo, mat);
    tuft.position.set(x, y, z);
    tuft.rotation.x = -0.3;
    body.add(tuft);
  }
}

export function attachScaleRidges(body: THREE.Group, mat: THREE.Material): void {
  const geo = new THREE.TorusGeometry(0.06, 0.015, 6, 8, Math.PI);
  const offsets = [0.08, 0.16, 0.24];
  for (const dy of offsets) {
    const ridge = new THREE.Mesh(geo, mat);
    ridge.position.set(0, dy, -0.15);
    ridge.rotation.x = -Math.PI / 2;
    body.add(ridge);
  }
}

export function attachSpiralTip(tailPivot: THREE.Group, mat: THREE.Material): void {
  const spiral = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.025, 8, 12, Math.PI * 1.2), mat,
  );
  spiral.position.set(0, -0.08, -0.18);
  spiral.rotation.x = Math.PI / 4;
  tailPivot.add(spiral);
}
