import * as THREE from 'three';
import { ItemType } from '../../models/item.model';
import { ITEM_COLORS } from './animal-palettes';

// ── Shared helpers ──────────────────────────────────────────

function mat(color: number, emissive = false): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    ...(emissive ? { emissive: color, emissiveIntensity: 0.25 } : {}),
  });
}

function group(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  children.forEach(c => { c.castShadow = true; g.add(c); });
  return g;
}

// ── Per-item builders ───────────────────────────────────────

/** Round bomb body + short fuse cylinder on top. */
function buildSmokeBomb(color: number): THREE.Object3D {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), mat(color));
  const fuse = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6),
    mat(0x444444),
  );
  fuse.position.y = 0.32;
  return group(body, fuse);
}

/** Small standing mannequin — cylinder body + sphere head. */
function buildDecoy(color: number): THREE.Object3D {
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.4, 8),
    mat(color),
  );
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat(color));
  head.position.y = 0.32;
  return group(torso, head);
}

/** Upward-pointing cone with a small tail fin — speed arrow. */
function buildSpeedBurst(color: number): THREE.Object3D {
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.5, 8),
    mat(color, true),
  );
  cone.position.y = 0.15;
  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.12, 0.15, 6),
    mat(color),
  );
  tail.position.y = -0.15;
  return group(cone, tail);
}

/** Wooden shaft with a pointed stone tip. */
function buildSpear(color: number): THREE.Object3D {
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6),
    mat(color),
  );
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.25, 6),
    mat(0x9e9e9e),
  );
  tip.position.y = 0.62;
  return group(shaft, tip);
}

/** Two small weighted spheres connected by a thin rod. */
function buildBolo(color: number): THREE.Object3D {
  const leftBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat(color));
  leftBall.position.x = -0.2;
  const rightBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat(color));
  rightBall.position.x = 0.2;
  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4),
    mat(0x5d4037),
  );
  rope.rotation.z = Math.PI / 2;
  return group(leftBall, rightBall, rope);
}

/** Small red sphere cluster — main berry + two smaller bumps. */
function buildBerry(color: number): THREE.Object3D {
  const main = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), mat(color, true));
  const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat(color));
  b1.position.set(0.12, 0.06, 0.08);
  const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat(color));
  b2.position.set(-0.1, 0.04, -0.09);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4),
    mat(0x4caf50),
  );
  stem.position.y = 0.2;
  return group(main, b1, b2, stem);
}

/** Classic mushroom — thin stem + wide dome cap. */
function buildMushroom(color: number): THREE.Object3D {
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.25, 8),
    mat(0xf5f5dc),
  );
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(color, true),
  );
  cap.position.y = 0.12;
  return group(stem, cap);
}

/** Horizontal chubby worm — elongated capsule-like body + tiny head. */
function buildGrub(color: number): THREE.Object3D {
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.1, 0.3, 4, 8),
    mat(color, true),
  );
  body.rotation.z = Math.PI / 2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat(0xa08600));
  head.position.x = 0.22;
  return group(body, head);
}

// ── Fresnel glow shell ──────────────────────────────────────

function createFresnelShell(color: number, radius = 0.5): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 16, 12);
  const fresnelMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime:  { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
        fresnel = pow(fresnel, 2.0);
        float pulse = 0.5 + 0.5 * sin(uTime * 3.0);
        gl_FragColor = vec4(uColor, fresnel * (0.4 + 0.3 * pulse));
      }
    `,
  });

  const shell = new THREE.Mesh(geo, fresnelMat);
  shell.name = 'fresnelShell';
  shell.renderOrder = 2;
  shell.onBeforeRender = () => {
    fresnelMat.uniforms['uTime'].value = performance.now() * 0.001;
  };
  return shell;
}

// ── Public API ──────────────────────────────────────────────

const BUILDERS: Record<ItemType, (color: number) => THREE.Object3D> = {
  smoke_bomb:  buildSmokeBomb,
  decoy:       buildDecoy,
  speed_burst: buildSpeedBurst,
  spear:       buildSpear,
  bolo:        buildBolo,
  berry:       buildBerry,
  mushroom:    buildMushroom,
  grub:        buildGrub,
};

/** Build a pickup mesh for the given item type, wrapped in a fresnel glow shell. */
export function buildItemMesh(type: ItemType): THREE.Object3D {
  const color = ITEM_COLORS[type] ?? 0xffffff;
  const builder = BUILDERS[type];
  const obj = builder(color);
  obj.castShadow = true;
  obj.add(createFresnelShell(color));
  return obj;
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
