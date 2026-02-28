import * as THREE from 'three';
import { ItemType } from '../../models/item.model';
import { ITEM_COLORS } from './animal-palettes';

/** Build a pickup mesh for the given item type. */
export function buildItemMesh(type: ItemType): THREE.Mesh {
  const color = ITEM_COLORS[type] ?? 0xffffff;

  switch (type) {
    case 'spear': {
      const geo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
      mesh.castShadow = true;
      return mesh;
    }
    case 'bolo': {
      const geo = new THREE.SphereGeometry(0.2, 6, 6);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
      mesh.castShadow = true;
      return mesh;
    }
    default: {
      const geo = new THREE.OctahedronGeometry(0.3, 0);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      return mesh;
    }
  }
}

/** Build an in-flight projectile mesh. */
export function buildProjectileMesh(type: string): THREE.Mesh {
  if (type === 'spear') {
    const geo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6);
    geo.rotateX(Math.PI / 2);
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8d6e63 }));
  }
  const geo = new THREE.SphereGeometry(0.15, 6, 6);
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x78909c }));
}
