import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { getTerrainHeight } from '../mesh/terrain-heightmap.builder';

interface FootprintSpawn {
  x: number;
  z: number;
  yaw: number;
  life: number;
  scale: number;
  opacity: number;
}

interface FootprintSlot {
  active: boolean;
  age: number;
  life: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  scale: number;
  opacity: number;
}

const MAX_FOOTPRINTS = 700;
const FOOTPRINT_Y_OFFSET = 0.018;
const FOOTPRINT_SIZE = 0.26;
const FOOTPRINT_RENDER_ORDER = 2;
const FOOTPRINT_HOLD_RATIO = 0.25;
const FOOTPRINT_MIN_SCALE_RATIO = 0.45;
const FOOTPRINT_DARKNESS = 1.00; //0.54

@Injectable({ providedIn: 'root' })
export class FootprintVfxService {
  private scene: THREE.Scene | null = null;
  private mesh: THREE.InstancedMesh | null = null;
  private material: THREE.MeshBasicMaterial | null = null;
  private slots = this.createSlots();
  private nextIndex = 0;
  private matrix = new THREE.Matrix4();
  private position = new THREE.Vector3();
  private rotation = new THREE.Quaternion();
  private scale = new THREE.Vector3();
  private euler = new THREE.Euler();
  private color = new THREE.Color();

  init(scene: THREE.Scene): void {
    this.dispose();
    this.scene = scene;
    this.createMesh();
    this.resetAllSlots();
  }

  dispose(): void {
    if (this.scene && this.mesh) this.scene.remove(this.mesh);
    this.mesh?.geometry.dispose();
    this.material?.alphaMap?.dispose();
    this.material?.dispose();
    this.mesh = null;
    this.material = null;
    this.scene = null;
    this.nextIndex = 0;
    this.resetSlotData();
  }

  spawn(spawn: FootprintSpawn): void {
    if (!this.mesh) return;
    const index = this.nextIndex;
    this.nextIndex = (this.nextIndex + 1) % MAX_FOOTPRINTS;
    this.activateSlot(index, spawn);
    this.applySlot(index);
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
  }

  tick(delta: number): void {
    if (!this.mesh) return;
    let dirty = false;
    for (let i = 0; i < this.slots.length; i++) dirty = this.tickSlot(i, delta) || dirty;
    if (!dirty) return;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
  }

  private createMesh(): void {
    const geo = new THREE.PlaneGeometry(FOOTPRINT_SIZE, FOOTPRINT_SIZE * 1.45);
    this.material = this.createMaterial();
    this.mesh = new THREE.InstancedMesh(geo, this.material, MAX_FOOTPRINTS);
    this.mesh.renderOrder = FOOTPRINT_RENDER_ORDER;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.scene?.add(this.mesh);
  }

  private createMaterial(): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: 0xffffff,
      alphaMap: this.createFootprintAlpha(),
      transparent: true,
      opacity: 1,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      side: THREE.DoubleSide,
      toneMapped: false,
      vertexColors: true,
    });
  }

  private createFootprintAlpha(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    this.drawHeel(ctx, canvas.width, canvas.height);
    this.drawToePad(ctx, canvas.width, canvas.height);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  private drawHeel(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const cx = width * 0.5;
    const cy = height * 0.72;
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, width * 0.26);
    grad.addColorStop(0, 'rgba(139, 69, 19, 1)');
    grad.addColorStop(1, 'rgba(139, 69, 19, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, width * 0.22, height * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawToePad(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const cx = width * 0.5;
    const cy = height * 0.34;
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, width * 0.24);
    grad.addColorStop(0, 'rgba(139, 69, 19, 1)');
    grad.addColorStop(1, 'rgba(139, 69, 19, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, width * 0.2, height * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private tickSlot(index: number, delta: number): boolean {
    const slot = this.slots[index];
    if (!slot.active) return false;
    slot.age += delta;
    if (slot.age >= slot.life) return this.deactivateSlot(index);
    this.applySlot(index);
    return true;
  }

  private activateSlot(index: number, spawn: FootprintSpawn): void {
    const y = getTerrainHeight(spawn.x, spawn.z) + FOOTPRINT_Y_OFFSET;
    const slot = this.slots[index];
    slot.active = true;
    slot.age = 0;
    slot.life = Math.max(0.1, spawn.life);
    slot.x = spawn.x;
    slot.y = y;
    slot.z = spawn.z;
    slot.yaw = spawn.yaw;
    slot.scale = spawn.scale;
    slot.opacity = spawn.opacity;
  }

  private deactivateSlot(index: number): boolean {
    const slot = this.slots[index];
    slot.active = false;
    this.setHiddenMatrix(index);
    this.mesh?.setColorAt(index, this.color.setRGB(1, 1, 1));
    return true;
  }

  private applySlot(index: number): void {
    const slot = this.slots[index];
    const fade = this.getFade(slot.age, slot.life);
    const stampScale = slot.scale * this.getScaleRatio(fade);
    this.euler.set(-Math.PI / 2, slot.yaw, 0);
    this.rotation.setFromEuler(this.euler);
    this.position.set(slot.x, slot.y, slot.z);
    this.scale.set(stampScale, stampScale, stampScale);
    this.matrix.compose(this.position, this.rotation, this.scale);
    this.mesh?.setMatrixAt(index, this.matrix);
    const brightness = 1 - FOOTPRINT_DARKNESS * slot.opacity * fade;
    this.mesh?.setColorAt(index, this.color.setRGB(brightness, brightness, brightness));
  }

  private getFade(age: number, life: number): number {
    const t = Math.max(0, Math.min(1, age / life));
    if (t <= FOOTPRINT_HOLD_RATIO) return 1;
    const fadeT = (t - FOOTPRINT_HOLD_RATIO) / (1 - FOOTPRINT_HOLD_RATIO);
    return 1 - fadeT;
  }

  private getScaleRatio(fade: number): number {
    return FOOTPRINT_MIN_SCALE_RATIO + (1 - FOOTPRINT_MIN_SCALE_RATIO) * fade;
  }

  private setHiddenMatrix(index: number): void {
    this.position.set(0, -1000, 0);
    this.rotation.identity();
    this.scale.set(0.0001, 0.0001, 0.0001);
    this.matrix.compose(this.position, this.rotation, this.scale);
    this.mesh?.setMatrixAt(index, this.matrix);
  }

  private resetAllSlots(): void {
    if (!this.mesh) return;
    for (let i = 0; i < this.slots.length; i++) {
      this.setHiddenMatrix(i);
      this.mesh.setColorAt(i, this.color.setRGB(1, 1, 1));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
  }

  private createSlots(): FootprintSlot[] {
    return Array.from({ length: MAX_FOOTPRINTS }, () => this.createSlot());
  }

  private createSlot(): FootprintSlot {
    return { active: false, age: 0, life: 1, x: 0, y: 0, z: 0, yaw: 0, scale: 1, opacity: 1 };
  }

  private resetSlotData(): void {
    for (const slot of this.slots) slot.active = false;
  }
}
