import * as THREE from 'three';

/** Well-known child names used by the animation system to find body parts. */
export const PART_NAMES = {
  body: 'body',
  head: 'head',
  leftLeg: 'leg_L',
  rightLeg: 'leg_R',
  leftArm: 'arm_L',
  rightArm: 'arm_R',
  leftFoot: 'foot_L',
  rightFoot: 'foot_R',
  tail: 'tail',
  tailTip: 'tailTip',
  leftEar: 'ear_L',
  rightEar: 'ear_R',
  leftWing: 'wing_L',
  rightWing: 'wing_R',
} as const;

/** Chibi dot eyes (big white circle + black pupil + tiny shine). */
export function attachCozyEyes(
  group: THREE.Group, y: number, z: number, spacing = 0.16, size = 0.09,
): void {
  const whiteGeo = new THREE.SphereGeometry(size, 8, 8);
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilGeo = new THREE.SphereGeometry(size * 0.55, 6, 6);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const shineGeo = new THREE.SphereGeometry(size * 0.2, 4, 4);
  const shineMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6,
  });

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(whiteGeo, whiteMat);
    eye.position.set(side * spacing, y, z);
    group.add(eye);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(side * spacing, y, z + size * 0.7);
    group.add(pupil);
    const shine = new THREE.Mesh(shineGeo, shineMat);
    shine.position.set(side * spacing + 0.03, y + 0.03, z + size * 0.95);
    group.add(shine);
  }
}

/** Small bean nose. */
export function attachNose(
  group: THREE.Group, y: number, z: number, color: number,
): void {
  const geo = new THREE.SphereGeometry(0.05, 6, 6);
  const mat = new THREE.MeshStandardMaterial({ color });
  const nose = new THREE.Mesh(geo, mat);
  nose.position.set(0, y, z);
  group.add(nose);
}

/** Blush ovals (pink circles on cheeks). */
export function attachBlush(
  group: THREE.Group, y: number, z: number, spacing = 0.28,
): void {
  const geo = new THREE.CircleGeometry(0.06, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xf5a0a0, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const blush = new THREE.Mesh(geo, mat);
    blush.position.set(side * spacing, y, z + 0.01);
    blush.lookAt(blush.position.x, blush.position.y, z + 1);
    group.add(blush);
  }
}

/** Two stubby legs with well-known names for animation. */
export function attachLegs(
  group: THREE.Group, color: number, spacing = 0.18, height = 0.2,
): void {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const geo = new THREE.CylinderGeometry(0.1, 0.12, height, 6);
  const names = [PART_NAMES.leftLeg, PART_NAMES.rightLeg];
  let i = 0;
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(geo, mat);
    leg.name = names[i++];
    leg.position.set(side * spacing, height / 2, 0);
    leg.castShadow = true;
    group.add(leg);
  }
}

/** Round paw/foot with well-known names. */
export function attachFeet(
  group: THREE.Group, color: number, spacing = 0.18,
): void {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const geo = new THREE.SphereGeometry(0.1, 6, 6);
  const names = [PART_NAMES.leftFoot, PART_NAMES.rightFoot];
  let i = 0;
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(geo, mat);
    foot.name = names[i++];
    foot.position.set(side * spacing, 0.06, 0.06);
    foot.scale.set(1, 0.6, 1.2);
    group.add(foot);
  }
}

/** Floating name label sprite above head. */
export function buildNameSprite(name: string, isHunter: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 64);

  ctx.fillStyle = isHunter ? 'rgba(204,51,51,0.7)' : 'rgba(51,170,85,0.7)';
  const textWidth = Math.min(ctx.measureText(name).width + 24, 240);
  const pillX = (256 - textWidth) / 2;
  ctx.beginPath();
  ctx.roundRect(pillX, 12, textWidth, 40, 12);
  ctx.fill();

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2.5, 0.6, 1);
  return sprite;
}
