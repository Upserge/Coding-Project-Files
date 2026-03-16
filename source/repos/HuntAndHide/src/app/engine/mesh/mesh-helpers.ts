import * as THREE from 'three';
import { createStandardPart, createSurfaceMatcap } from './character-material.factory';

/**
 * Well-known child names used by the animation system to find body parts.
 *
 * Skeleton hierarchy:
 *   root Group  (world-positioned by SceneRenderService)
 *     body  GROUP  (bob / lean / sway)
 *       torso mesh, belly mesh
 *       head  GROUP  (tilt / nod - follows body automatically)
 *         head mesh, snout, nose, eyes, blush, ear_L, ear_R
 *       arm_L, arm_R  (swing)
 *       wing_L, wing_R  (flap - owl)
 *       tail  GROUP  (wag / droop)
 *         tail mesh, tailTip
 *     leg_L  GROUP  (walk cycle - stays grounded)
 *       leg mesh + foot mesh
 *     leg_R  GROUP
 *     name label sprite
 */
export const PART_NAMES = {
  body:      'body',
  head:      'head',
  leftLeg:   'leg_L',
  rightLeg:  'leg_R',
  leftArm:   'arm_L',
  rightArm:  'arm_R',
  leftFoot:  'foot_L',
  rightFoot: 'foot_R',
  tail:      'tail',
  tailTip:   'tailTip',
  leftEar:   'ear_L',
  rightEar:  'ear_R',
  leftWing:  'wing_L',
  rightWing: 'wing_R',
} as const;

// Skeleton pivot factories

export function createBodyPivot(root: THREE.Group, y: number): THREE.Group {
  const pivot = new THREE.Group();
  pivot.name = PART_NAMES.body;
  pivot.position.y = y;
  pivot.userData['baseY'] = y;
  root.add(pivot);
  return pivot;
}

export function createHeadPivot(bodyPivot: THREE.Group, relY: number): THREE.Group {
  const pivot = new THREE.Group();
  pivot.name = PART_NAMES.head;
  pivot.position.y = relY;
  bodyPivot.add(pivot);
  return pivot;
}

export function createTailPivot(
  bodyPivot: THREE.Group,
  relY: number,
  relZ: number,
  baseRotX = 0,
): THREE.Group {
  const pivot = new THREE.Group();
  pivot.name = PART_NAMES.tail;
  pivot.position.set(0, relY, relZ);
  pivot.rotation.x = baseRotX;
  pivot.userData['baseRotX'] = baseRotX;
  bodyPivot.add(pivot);
  return pivot;
}

// Cosmetic helpers

// Shared eye materials (identical across all characters)
let _whiteMat: THREE.MeshStandardMaterial | null = null;
let _pupilMat: THREE.MeshStandardMaterial | null = null;
let _shineMat: THREE.MeshStandardMaterial | null = null;
function getEyeWhiteMat(): THREE.MeshStandardMaterial { return _whiteMat ??= createStandardPart(0xffffff, 'glossy'); }
function getEyePupilMat(): THREE.MeshStandardMaterial { return _pupilMat ??= createStandardPart(0x222222, 'glossy'); }
function getEyeShineMat(): THREE.MeshStandardMaterial {
  return _shineMat ??= new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6 });
}

export function attachCozyEyes(
  group: THREE.Group, y: number, z: number, spacing = 0.16, size = 0.09,
): void {
  const whiteGeo = new THREE.SphereGeometry(size, 16, 16);
  const pupilGeo = new THREE.SphereGeometry(size * 0.55, 12, 12);
  const shineGeo = new THREE.SphereGeometry(size * 0.2, 8, 8);

  const pupilNames = ['pupil_L', 'pupil_R'];
  let idx = 0;
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(whiteGeo, getEyeWhiteMat());
    eye.position.set(side * spacing, y, z);
    group.add(eye);
    const pupil = new THREE.Mesh(pupilGeo, getEyePupilMat());
    pupil.name = pupilNames[idx++];
    pupil.position.set(side * spacing, y, z + size * 0.7);
    group.add(pupil);
    const shine = new THREE.Mesh(shineGeo, getEyeShineMat());
    shine.position.set(side * spacing + 0.03, y + 0.03, z + size * 0.95);
    group.add(shine);
  }
}

let _noseGeo: THREE.SphereGeometry | null = null;
function getNoseGeo(): THREE.SphereGeometry { return _noseGeo ??= new THREE.SphereGeometry(0.05, 12, 12); }

export function attachNose(
  group: THREE.Group, y: number, z: number, color: number,
): void {
  const mat = createStandardPart(color, 'glossy');
  const nose = new THREE.Mesh(getNoseGeo(), mat);
  nose.position.set(0, y, z);
  group.add(nose);
}

let _blushGeo: THREE.CircleGeometry | null = null;
let _blushMat: THREE.MeshBasicMaterial | null = null;
function getBlushGeo(): THREE.CircleGeometry { return _blushGeo ??= new THREE.CircleGeometry(0.06, 8); }
function getBlushMat(): THREE.MeshBasicMaterial {
  return _blushMat ??= new THREE.MeshBasicMaterial({ color: 0xf5a0a0, side: THREE.DoubleSide });
}

export function attachBlush(
  group: THREE.Group, y: number, z: number, spacing = 0.28,
): void {
  for (const side of [-1, 1]) {
    const blush = new THREE.Mesh(getBlushGeo(), getBlushMat());
    blush.position.set(side * spacing, y, z);
    blush.lookAt(blush.position.x, blush.position.y, z + 1);
    group.add(blush);
  }
}

// Leg / foot pivots

export function attachLegs(
  root: THREE.Group, color: number, spacing = 0.18, height = 0.2,
): void {
  const legMat = createSurfaceMatcap(color);
  const legGeo = new THREE.CapsuleGeometry(0.09, height * 0.6, 8, 12);
  const footMat = createSurfaceMatcap(color);
  const footGeo = new THREE.SphereGeometry(0.1, 12, 12);

  const names = [PART_NAMES.leftLeg, PART_NAMES.rightLeg];
  let i = 0;
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = names[i++];
    pivot.position.set(side * spacing, height, 0);

    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.y = -height / 2;
    leg.castShadow = true;
    pivot.add(leg);

    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(0, -height + 0.06, 0.06);
    foot.scale.set(1, 0.6, 1.2);
    pivot.add(foot);

    root.add(pivot);
  }
}

export function attachFeetOnly(
  root: THREE.Group, color: number, spacing = 0.18,
): void {
  const mat = createSurfaceMatcap(color);
  const geo = new THREE.SphereGeometry(0.1, 12, 12);
  const names = [PART_NAMES.leftLeg, PART_NAMES.rightLeg];
  let i = 0;
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = names[i++];
    pivot.position.set(side * spacing, 0.12, 0);

    const foot = new THREE.Mesh(geo, mat);
    foot.position.set(0, -0.06, 0.06);
    foot.scale.set(1, 0.6, 1.2);
    pivot.add(foot);

    root.add(pivot);
  }
}

// Rim lighting

const OUTLINE_NAME = 'rimOutline';
const OUTLINE_SCALE = 1.08;

type OutlineUniforms = {
  outlineColor: { value: THREE.Color };
  rimPower: { value: number };
  rimStrength: { value: number };
};

/**
 * Apply a Fresnel-style outline shell without mutating base materials.
 */
export function applyRimLighting(group: THREE.Group, rimColor = new THREE.Color(0xfff8e1), rimPower = 2.5, rimStrength = 0.35): void {
  group.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!shouldOutlineMesh(mesh)) return;
    attachOutline(mesh, rimColor, rimPower, rimStrength);
  });
}

export function updateRimLighting(group: THREE.Group, rimColor: THREE.ColorRepresentation, rimPower = 2.5, rimStrength = 0.35): void {
  group.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!shouldOutlineMesh(mesh)) return;
    updateOutline(mesh, rimColor, rimPower, rimStrength);
  });
}

function shouldOutlineMesh(mesh: THREE.Mesh): boolean {
  if (!mesh?.isMesh) return false;
  if (mesh.name === OUTLINE_NAME) return false;
  return !Array.isArray(mesh.material);
}

function attachOutline(
  mesh: THREE.Mesh,
  rimColor: THREE.ColorRepresentation,
  rimPower: number,
  rimStrength: number,
): void {
  const existing = getOutline(mesh);
  if (existing) return void syncOutline(existing, rimColor, rimPower, rimStrength);
  mesh.add(buildOutline(mesh, rimColor, rimPower, rimStrength));
}

function updateOutline(
  mesh: THREE.Mesh,
  rimColor: THREE.ColorRepresentation,
  rimPower: number,
  rimStrength: number,
): void {
  const outline = getOutline(mesh);
  if (!outline) return;
  syncOutline(outline, rimColor, rimPower, rimStrength);
}

function getOutline(mesh: THREE.Mesh): THREE.Mesh | null {
  return mesh.children.find(child => child.name === OUTLINE_NAME) as THREE.Mesh | null;
}

function buildOutline(
  mesh: THREE.Mesh,
  rimColor: THREE.ColorRepresentation,
  rimPower: number,
  rimStrength: number,
): THREE.Mesh {
  const outline = new THREE.Mesh(mesh.geometry, createOutlineMaterial(rimColor, rimPower, rimStrength));
  outline.name = OUTLINE_NAME;
  outline.renderOrder = -1;
  outline.frustumCulled = false;
  outline.scale.multiplyScalar(OUTLINE_SCALE);
  return outline;
}

function createOutlineMaterial(
  rimColor: THREE.ColorRepresentation,
  rimPower: number,
  rimStrength: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      outlineColor: { value: new THREE.Color(rimColor) },
      rimPower: { value: rimPower },
      rimStrength: { value: rimStrength },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 outlineColor;
      uniform float rimPower;
      uniform float rimStrength;

      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), rimPower);
        float alpha = clamp(fresnel * rimStrength, 0.0, 1.0);
        if (alpha <= 0.01) discard;
        gl_FragColor = vec4(outlineColor, alpha);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
}

function syncOutline(
  outline: THREE.Mesh,
  rimColor: THREE.ColorRepresentation,
  rimPower: number,
  rimStrength: number,
): void {
  const uniforms = (outline.material as THREE.ShaderMaterial).uniforms as OutlineUniforms;
  uniforms['outlineColor'].value.set(rimColor);
  uniforms['rimPower'].value = rimPower;
  uniforms['rimStrength'].value = rimStrength;
}

// Name label

export function buildNameSprite(name: string, isHunter: boolean, isCpu = false): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 64);

  const label = isCpu ? `🤖 ${name}` : name;
  const bgColor = isCpu
    ? 'rgba(120,80,200,0.75)'
    : isHunter
      ? 'rgba(204,51,51,0.7)'
      : 'rgba(51,170,85,0.7)';

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = bgColor;
  const textWidth = Math.min(ctx.measureText(label).width + 24, 240);
  const pillX = (256 - textWidth) / 2;
  ctx.beginPath();
  ctx.roundRect(pillX, 12, textWidth, 40, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2.5, 0.6, 1);
  // Layer 1 = UI overlay, rendered after post-processing to avoid god-ray scatter
  sprite.layers.set(1);
  return sprite;
}
