import * as THREE from 'three';
import { DecorationType } from '../../models/map.model';

/** Map-based dispatch for decoration meshes. */
const DECO_BUILDERS: Record<DecorationType, () => THREE.Group> = {
  fern:             buildFern,
  flower:           buildFlower,
  mushroom_cluster: buildMushroomCluster,
  fallen_log:       buildFallenLog,
  vine:             buildVine,
};

/** Build a decoration mesh by type. Returns null for unknown types. */
export function buildDecorationMesh(type: DecorationType): THREE.Group | null {
  const builder = DECO_BUILDERS[type];
  return builder ? builder() : null;
}

// ── Individual builders ─────────────────────────────────────

function buildFern(): THREE.Group {
  const group = new THREE.Group();
  const frondCount = 7;
  for (let i = 0; i < frondCount; i++) {
    const frond = createFernFrond();
    const angle = (i / frondCount) * Math.PI * 2;
    frond.position.set(Math.cos(angle) * 0.1, 0.05, Math.sin(angle) * 0.1);
    frond.rotation.set(-0.7 - Math.random() * 0.3, angle, 0);
    group.add(frond);
  }
  return group;
}

function createFernFrond(): THREE.Mesh {
  // Elongated leaf shape via ShapeGeometry
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.18, 0.35, 0.06, 0.75);
  shape.lineTo(0, 0.85);
  shape.lineTo(-0.06, 0.75);
  shape.quadraticCurveTo(-0.18, 0.35, 0, 0);

  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    side: THREE.DoubleSide,
    roughness: 0.85,
  });
  return new THREE.Mesh(geo, mat);
}

// ── Sprite-based billboarded flowers ────────────────────────

const PETAL_COLORS = ['#ff7043', '#ffd54f', '#ba68c8', '#4fc3f7'];
const flowerSpriteCache = new Map<string, THREE.SpriteMaterial>();

function buildFlower(): THREE.Group {
  const group = new THREE.Group();
  const color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
  const mat = getFlowerSpriteMaterial(color);
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.65, 0.85, 1);
  sprite.position.y = 0.35;
  group.add(sprite);
  return group;
}

function getFlowerSpriteMaterial(color: string): THREE.SpriteMaterial {
  let mat = flowerSpriteCache.get(color);
  if (!mat) {
    mat = new THREE.SpriteMaterial({
      map: createFlowerTexture(color),
      transparent: true,
      depthWrite: false,
    });
    flowerSpriteCache.set(color, mat);
  }
  return mat;
}

function createFlowerTexture(petalColor: string): THREE.CanvasTexture {
  const s = 64;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, s, s);

  // Stem
  ctx.strokeStyle = '#2e7d32';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 60);
  ctx.quadraticCurveTo(30, 42, 32, 26);
  ctx.stroke();

  // Small leaf
  ctx.fillStyle = '#388e3c';
  ctx.beginPath();
  ctx.ellipse(27, 44, 5, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Petals
  ctx.fillStyle = petalColor;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.ellipse(32 + Math.cos(a) * 7, 20 + Math.sin(a) * 7, 6, 4, a, 0, Math.PI * 2);
    ctx.fill();
  }

  // Center
  ctx.fillStyle = '#fff176';
  ctx.beginPath();
  ctx.arc(32, 20, 4, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildMushroomCluster(): THREE.Group {
  const group = new THREE.Group();
  group.add(buildMushroom(0, 0, 0, 0.12, 0.2));
  group.add(buildMushroom(0.15, 0, 0.1, 0.08, 0.15));
  group.add(buildMushroom(-0.1, 0, 0.12, 0.1, 0.17));
  return group;
}

function buildMushroom(x: number, _y: number, z: number, capR: number, stemH: number): THREE.Group {
  const group = new THREE.Group();
  const stemGeo = new THREE.CylinderGeometry(capR * 0.3, capR * 0.35, stemH, 5);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.9 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = stemH / 2;
  group.add(stem);

  const capGeo = new THREE.SphereGeometry(capR, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
  const capMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.8 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = stemH;
  group.add(cap);

  group.position.set(x, 0, z);
  return group;
}

function buildFallenLog(): THREE.Group {
  const group = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.2, 0.25, 1.8, 6);
  geo.rotateZ(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 1 });
  const log = new THREE.Mesh(geo, mat);
  log.position.y = 0.2;
  log.castShadow = true;
  group.add(log);

  const mossGeo = new THREE.SphereGeometry(0.15, 4, 3);
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x558b2f, roughness: 0.9 });
  const moss = new THREE.Mesh(mossGeo, mossMat);
  moss.position.set(0.3, 0.35, 0);
  moss.scale.set(2, 0.4, 1);
  group.add(moss);
  return group;
}

function buildVine(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x33691e, roughness: 0.85 });
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.CylinderGeometry(0.015, 0.02, 0.5 + i * 0.15, 4);
    const vine = new THREE.Mesh(geo, mat);
    vine.position.set(i * 0.08 - 0.08, 0.25, 0);
    vine.rotation.z = (i - 1) * 0.15;
    group.add(vine);
  }
  return group;
}

// tall_grass removed — grass is now handled by instanced-grass.builder.ts
