import { inject, Injectable } from '@angular/core';
import * as THREE from 'three';
import { PlayerState, HiderState, HunterState, AnimalCharacter, Vec3 } from '../models/player.model';
import { Item, ItemType } from '../models/item.model';
import { ProjectileState } from '../services/hunter.service';

// ── Colour palettes ──────────────────────────────────────────

const ANIMAL_COLORS: Record<AnimalCharacter, number> = {
  // Hiders — earthy, warm tones
  fox:       0xe07832,
  rabbit:    0xc2a878,
  deer:      0x8b6914,
  frog:      0x5cb85c,
  owl:       0x7a5c3e,
  snake:     0x556b2f,
  chameleon: 0x20b2aa,
  // Hunters — bold, predatory
  wolf:    0x606060,
  lion:    0xd4a030,
  panther: 0x1a1a2e,
};

const ITEM_COLORS: Record<ItemType, number> = {
  smoke_bomb:  0x888888,
  decoy:       0xffa726,
  speed_burst: 0x42a5f5,
  spear:       0x8d6e63,
  bolo:        0x78909c,
  berry:       0xe53935,
  mushroom:    0xab47bc,
  grub:        0xc6a700,
};

const HUNTER_BODY_COLOR = 0xcc3333;
const HIDER_BODY_COLOR  = 0x33aa55;

/**
 * SceneRenderService creates and syncs Three.js meshes for players,
 * items, and projectiles each frame based on GameLoopService signals.
 *
 * Call `init(scene)` once, then `sync(...)` every frame from the tick.
 */
@Injectable({ providedIn: 'root' })
export class SceneRenderService {

  private scene!: THREE.Scene;

  // Mesh registries keyed by entity id
  private playerMeshes = new Map<string, THREE.Group>();
  private playerLabels = new Map<string, THREE.Sprite>();
  private itemMeshes   = new Map<string, THREE.Mesh>();
  private projMeshes   = new Map<string, THREE.Mesh>();

  // ── Lifecycle ──────────────────────────────────────────────

  init(scene: THREE.Scene): void {
    this.scene = scene;
  }

  dispose(): void {
    this.playerMeshes.forEach(m => this.scene?.remove(m));
    this.itemMeshes.forEach(m => this.scene?.remove(m));
    this.projMeshes.forEach(m => this.scene?.remove(m));
    this.playerMeshes.clear();
    this.itemMeshes.clear();
    this.projMeshes.clear();
  }

  // ── Per-frame sync ─────────────────────────────────────────

  syncPlayers(players: PlayerState[], localUid: string): void {
    const activeIds = new Set<string>();

    for (const player of players) {
      activeIds.add(player.uid);
      let group = this.playerMeshes.get(player.uid);

      if (!group) {
        group = this.buildPlayerMesh(player);
        this.playerMeshes.set(player.uid, group);
        this.scene.add(group);
      }

      // Position
      group.position.set(player.position.x, player.position.y, player.position.z);

      // Face movement direction via rotation.y
      if (player.rotation.y !== undefined) {
        group.rotation.y = player.rotation.y;
      }

      // Visibility
      group.visible = player.isAlive;

      // Local player indicator ring
      const ring = group.getObjectByName('localRing');
      if (ring) ring.visible = player.uid === localUid;
    }

    // Remove meshes for players no longer present
    for (const [uid, mesh] of this.playerMeshes) {
      if (!activeIds.has(uid)) {
        this.scene.remove(mesh);
        this.playerMeshes.delete(uid);
      }
    }
  }

  syncItems(items: Item[]): void {
    const activeIds = new Set<string>();

    for (const item of items) {
      if (item.isPickedUp) {
        // Hide picked-up items
        const existing = this.itemMeshes.get(item.id);
        if (existing) existing.visible = false;
        activeIds.add(item.id);
        continue;
      }

      activeIds.add(item.id);
      let mesh = this.itemMeshes.get(item.id);

      if (!mesh) {
        mesh = this.buildItemMesh(item.type);
        this.itemMeshes.set(item.id, mesh);
        this.scene.add(mesh);
      }

      mesh.position.set(item.position.x, item.position.y + 0.4, item.position.z);
      mesh.visible = true;

      // Gentle bob + spin for pickup feel
      mesh.rotation.y += 0.02;
      mesh.position.y += Math.sin(Date.now() * 0.003 + item.position.x) * 0.05;
    }

    for (const [id, mesh] of this.itemMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.itemMeshes.delete(id);
      }
    }
  }

  syncProjectiles(projectiles: ProjectileState[]): void {
    const activeIds = new Set<string>();

    for (const proj of projectiles) {
      activeIds.add(proj.id);
      let mesh = this.projMeshes.get(proj.id);

      if (!mesh) {
        mesh = this.buildProjectileMesh(proj.type);
        this.projMeshes.set(proj.id, mesh);
        this.scene.add(mesh);
      }

      mesh.position.set(proj.position.x, proj.position.y + 0.5, proj.position.z);
    }

    for (const [id, mesh] of this.projMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.projMeshes.delete(id);
      }
    }
  }

  // ── Mesh builders ──────────────────────────────────────────

  /**
   * Player mesh = body + head + eyes + role accent + name label + local ring.
   * Hunter animals share a similar predator silhouette (per copilot-instructions).
   * Hider animals get unique shapes.
   */
  private buildPlayerMesh(player: PlayerState): THREE.Group {
    const group = new THREE.Group();
    const color = ANIMAL_COLORS[player.animal];
    const isHunter = player.role === 'hunter';

    if (isHunter) {
      this.attachHunterBody(group, color);
    } else {
      this.attachHiderBody(group, color, player.animal);
    }

    // Eyes (two small white spheres)
    const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15, 1.55, 0.3);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15, 1.55, 0.3);
    group.add(leftEye, rightEye);

    // Pupil
    const pupilGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.15, 1.55, 0.36);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.15, 1.55, 0.36);
    group.add(leftPupil, rightPupil);

    // Role-coloured accent ring at feet
    const ringGeo = new THREE.RingGeometry(0.6, 0.75, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isHunter ? HUNTER_BODY_COLOR : HIDER_BODY_COLOR,
      side: THREE.DoubleSide,
    });
    const rolering = new THREE.Mesh(ringGeo, ringMat);
    rolering.rotation.x = -Math.PI / 2;
    rolering.position.y = 0.02;
    group.add(rolering);

    // Local player indicator (bright ring, hidden by default)
    const localGeo = new THREE.RingGeometry(0.8, 0.95, 24);
    const localMat = new THREE.MeshBasicMaterial({
      color: 0xe9c46a,
      side: THREE.DoubleSide,
    });
    const localRing = new THREE.Mesh(localGeo, localMat);
    localRing.rotation.x = -Math.PI / 2;
    localRing.position.y = 0.03;
    localRing.name = 'localRing';
    localRing.visible = false;
    group.add(localRing);

    // Floating name label
    const label = this.buildNameSprite(player.displayName, isHunter);
    label.position.set(0, 2.2, 0);
    group.add(label);

    group.castShadow = true;
    return group;
  }

  /** Hunter silhouette: stocky body, angular head, ears */
  private attachHunterBody(group: THREE.Group, color: number): void {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });

    // Body — wide cylinder
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.0, 8), mat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Head — box-ish (predator jaw)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), mat);
    head.position.y = 1.4;
    head.castShadow = true;
    group.add(head);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.12, 0.3, 4);
    const leftEar = new THREE.Mesh(earGeo, mat);
    leftEar.position.set(-0.22, 1.8, 0);
    const rightEar = new THREE.Mesh(earGeo, mat);
    rightEar.position.set(0.22, 1.8, 0);
    group.add(leftEar, rightEar);
  }

  /** Hider silhouette: varies by animal type for visual variety */
  private attachHiderBody(group: THREE.Group, color: number, animal: string): void {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });

    switch (animal) {
      case 'fox': {
        // Slim body + pointy head + bushy tail
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.9, 8), mat);
        body.position.y = 0.45;
        body.castShadow = true;
        group.add(body);
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 6), mat);
        head.position.set(0, 1.3, 0.1);
        head.rotation.x = Math.PI;
        group.add(head);
        // Tail
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.6, 6), mat);
        tail.position.set(0, 0.5, -0.5);
        tail.rotation.x = -0.4;
        group.add(tail);
        break;
      }
      case 'rabbit': {
        // Round body + tall ears
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), mat);
        body.position.y = 0.35;
        body.castShadow = true;
        group.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), mat);
        head.position.y = 1.0;
        group.add(head);
        const earGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.5, 6);
        const leftEar = new THREE.Mesh(earGeo, mat);
        leftEar.position.set(-0.12, 1.5, 0);
        const rightEar = new THREE.Mesh(earGeo, mat);
        rightEar.position.set(0.12, 1.5, 0);
        group.add(leftEar, rightEar);
        break;
      }
      case 'deer': {
        // Tall, slender
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.1, 8), mat);
        body.position.y = 0.55;
        body.castShadow = true;
        group.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mat);
        head.position.y = 1.4;
        group.add(head);
        // Antlers (two small cones)
        const antlerMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        const antlerGeo = new THREE.ConeGeometry(0.06, 0.4, 4);
        const leftAntler = new THREE.Mesh(antlerGeo, antlerMat);
        leftAntler.position.set(-0.18, 1.75, 0);
        leftAntler.rotation.z = 0.3;
        const rightAntler = new THREE.Mesh(antlerGeo, antlerMat);
        rightAntler.position.set(0.18, 1.75, 0);
        rightAntler.rotation.z = -0.3;
        group.add(leftAntler, rightAntler);
        break;
      }
      case 'frog': {
        // Low, wide
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), mat);
        body.position.y = 0.25;
        body.scale.set(1, 0.6, 1);
        body.castShadow = true;
        group.add(body);
        // Bulging eyes
        const eyeBulge = new THREE.SphereGeometry(0.12, 6, 6);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xcddc39 });
        const lEye = new THREE.Mesh(eyeBulge, eyeMat);
        lEye.position.set(-0.2, 0.5, 0.25);
        const rEye = new THREE.Mesh(eyeBulge, eyeMat);
        rEye.position.set(0.2, 0.5, 0.25);
        group.add(lEye, rEye);
        break;
      }
      case 'owl': {
        // Round, big head
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.8, 8), mat);
        body.position.y = 0.4;
        body.castShadow = true;
        group.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mat);
        head.position.y = 1.15;
        group.add(head);
        // Ear tufts
        const tuftGeo = new THREE.ConeGeometry(0.08, 0.25, 4);
        const tuftMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        const lTuft = new THREE.Mesh(tuftGeo, tuftMat);
        lTuft.position.set(-0.2, 1.5, 0);
        const rTuft = new THREE.Mesh(tuftGeo, tuftMat);
        rTuft.position.set(0.2, 1.5, 0);
        group.add(lTuft, rTuft);
        break;
      }
      case 'snake': {
        // Low, elongated
        const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 0.15;
        body.castShadow = true;
        group.add(body);
        // Head (sphere at front)
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mat);
        head.position.set(0, 0.18, 0.6);
        group.add(head);
        break;
      }
      case 'chameleon':
      default: {
        // Default round body
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), mat);
        body.position.y = 0.35;
        body.castShadow = true;
        group.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat);
        head.position.y = 1.0;
        group.add(head);
        // Tail curl
        const tail = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 6, 12, Math.PI), mat);
        tail.position.set(0, 0.4, -0.4);
        tail.rotation.y = Math.PI;
        group.add(tail);
        break;
      }
    }
  }

  // ── Item meshes ────────────────────────────────────────────

  private buildItemMesh(type: ItemType): THREE.Mesh {
    const color = ITEM_COLORS[type] ?? 0xffffff;

    switch (type) {
      case 'spear': {
        // Thin tall cylinder
        const geo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
        mesh.castShadow = true;
        return mesh;
      }
      case 'bolo': {
        // Two linked spheres
        const geo = new THREE.SphereGeometry(0.2, 6, 6);
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
        mesh.castShadow = true;
        return mesh;
      }
      default: {
        // Generic pickup: octahedron gem shape
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

  // ── Projectile meshes ──────────────────────────────────────

  private buildProjectileMesh(type: string): THREE.Mesh {
    if (type === 'spear') {
      const geo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6);
      geo.rotateX(Math.PI / 2); // align with Z forward
      return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8d6e63 }));
    }
    // Bolo
    const geo = new THREE.SphereGeometry(0.15, 6, 6);
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x78909c }));
  }

  // ── Name label sprite ──────────────────────────────────────

  private buildNameSprite(name: string, isHunter: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 256, 64);

    // Background pill
    ctx.fillStyle = isHunter ? 'rgba(204,51,51,0.7)' : 'rgba(51,170,85,0.7)';
    const textWidth = Math.min(ctx.measureText(name).width + 24, 240);
    const pillX = (256 - textWidth) / 2;
    ctx.beginPath();
    ctx.roundRect(pillX, 12, textWidth, 40, 12);
    ctx.fill();

    // Text
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
}
