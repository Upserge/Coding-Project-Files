import * as THREE from 'three';

// ── Shadow blob ──────────────────────────────────────────────

const SHADOW_BLOB_RADIUS = 0.5;
const SHADOW_BLOB_OPACITY = 0.25;

/** Dark translucent ellipse under the character for grounding. */
export function createShadowBlob(): THREE.Mesh {
  const geo = new THREE.CircleGeometry(SHADOW_BLOB_RADIUS, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: SHADOW_BLOB_OPACITY,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const blob = new THREE.Mesh(geo, mat);
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.01;
  blob.scale.set(1, 0.7, 1);
  blob.name = 'shadowBlob';
  return blob;
}
