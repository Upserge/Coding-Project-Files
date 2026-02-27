import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { MapService } from '../services/map.service';
import { MapConfig, ObstaclePlacement, OBSTACLE_CONFIGS } from '../models/map.model';

/**
 * EngineService owns the Three.js render loop and scene graph.
 *
 * Uses a true-isometric OrthographicCamera (≈30° from ground).
 * WebGPU path attempted first via dynamic import, with WebGL fallback.
 */
@Injectable({ providedIn: 'root' })
export class EngineService implements OnDestroy {
  private readonly mapService = inject(MapService);

  // ── Core Three.js objects ──────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private clock = new THREE.Clock();
  private animationFrameId = 0;
  private disposed = false;

  /** External tick callback — GameLoopService registers here. */
  onTick: ((delta: number) => void) | null = null;

  constructor(private ngZone: NgZone) {}

  // ── Public API ─────────────────────────────────────────────

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.createScene();
    this.createCamera(canvas.clientWidth, canvas.clientHeight);
    await this.createRenderer(canvas);
    this.buildJungleScene();
    this.startLoop();
  }

  getScene(): THREE.Scene { return this.scene; }
  getCamera(): THREE.OrthographicCamera { return this.camera; }

  resize(width: number, height: number): void {
    const aspect = width / height;
    const viewSize = 12;
    this.camera.left   = -viewSize * aspect;
    this.camera.right  =  viewSize * aspect;
    this.camera.top    =  viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  /** Move camera to follow a target position while keeping isometric angle. */
  followTarget(target: { x: number; y: number; z: number }): void {
    const isoDistance = 30;
    const angle = Math.PI / 6;  // 30°
    const yaw = Math.PI / 4;    // 45°
    this.camera.position.set(
      target.x + isoDistance * Math.cos(angle) * Math.sin(yaw),
      target.y + isoDistance * Math.sin(angle),
      target.z + isoDistance * Math.cos(angle) * Math.cos(yaw),
    );
    this.camera.lookAt(target.x, target.y, target.z);
  }

  ngOnDestroy(): void { this.dispose(); }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.animationFrameId);
    this.renderer?.dispose();
  }

  // ── Scene setup ────────────────────────────────────────────

  private createScene(): void {
    this.scene = new THREE.Scene();
    // Sky-blue background with warm tone (sun poking through canopy)
    this.scene.background = new THREE.Color(0x87ceaa);
    this.scene.fog = new THREE.FogExp2(0x87ceaa, 0.003);
  }

  private createCamera(width: number, height: number): void {
    const aspect = width / height;
    const viewSize = 12;

    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect, viewSize * aspect,
       viewSize, -viewSize,
       0.1, 800,
    );

    // True isometric: rotate 30° from ground, 45° around Y
    const isoDistance = 30;
    const angle = Math.PI / 6;  // 30°
    const yaw = Math.PI / 4;    // 45°
    this.camera.position.set(
      isoDistance * Math.cos(angle) * Math.sin(yaw),
      isoDistance * Math.sin(angle),
      isoDistance * Math.cos(angle) * Math.cos(yaw),
    );
    this.camera.lookAt(0, 0, 0);
  }

  private async createRenderer(canvas: HTMLCanvasElement): Promise<void> {
    if (navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          const { WebGPURenderer } = await import('three/webgpu');
          const gpuRenderer = new WebGPURenderer({ canvas, antialias: true });
          await gpuRenderer.init();
          gpuRenderer.setPixelRatio(devicePixelRatio);
          gpuRenderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
          this.renderer = gpuRenderer as unknown as THREE.WebGLRenderer;
          console.log('[Engine] WebGPU renderer active');
          return;
        }
      } catch (e) {
        console.warn('[Engine] WebGPU failed, falling back to WebGL', e);
      }
    }
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.shadowMap.enabled = true;
    console.log('[Engine] WebGL renderer active (fallback)');
  }

  // ── Jungle scene ───────────────────────────────────────────

  private buildJungleScene(): void {
    const map = this.mapService.generateJungleMap();
    this.buildGround(map);
    this.buildObstacles(map);
    this.buildLighting();
  }

  private buildGround(map: MapConfig): void {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(map.width, map.depth, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x2d6a4f,
        roughness: 0.9,
        metalness: 0,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private buildObstacles(map: MapConfig): void {
    for (const obs of map.obstacles) {
      const mesh = this.createObstacleMesh(obs);
      if (mesh) {
        mesh.position.set(obs.position.x, obs.position.y, obs.position.z);
        mesh.rotation.y = obs.rotationY;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
      }
    }
  }

  private createObstacleMesh(obs: ObstaclePlacement): THREE.Mesh | null {
    const config = OBSTACLE_CONFIGS[obs.type];
    if (!config) return null;

    switch (obs.type) {
      case 'tree':
        return this.buildTree();
      case 'bush':
        return this.buildBush();
      case 'leaf_pile':
        return this.buildLeafPile();
      case 'hole':
        return this.buildHole();
      case 'jeep':
      case 'truck':
        return this.buildVehicle(obs.type);
      case 'safari_gear':
        return this.buildSafariGear();
      case 'rock':
        return this.buildRock();
      default:
        return null;
    }
  }

  // ── Placeholder obstacle meshes (replace with models later) ─

  private buildTree(): THREE.Mesh {
    // Trunk + canopy as a single group approximated by a cone
    const geo = new THREE.ConeGeometry(1.5, 5, 6);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1b5e20 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 2.5;
    return mesh;
  }

  private buildBush(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(1.2, 8, 6);
    const mat = new THREE.MeshStandardMaterial({ color: 0x388e3c });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.6;
    return mesh;
  }

  private buildLeafPile(): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(1.2, 1.5, 0.3, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.15;
    return mesh;
  }

  private buildHole(): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -0.05;
    return mesh;
  }

  private buildVehicle(type: 'jeep' | 'truck'): THREE.Mesh {
    const w = type === 'jeep' ? 2 : 2.5;
    const d = type === 'jeep' ? 4 : 5;
    const h = type === 'jeep' ? 1.8 : 2.2;
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color: 0x795548 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = h / 2;
    return mesh;
  }

  private buildSafariGear(): THREE.Mesh {
    const geo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
    const mat = new THREE.MeshStandardMaterial({ color: 0xa1887f });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.2;
    return mesh;
  }

  private buildRock(): THREE.Mesh {
    const geo = new THREE.DodecahedronGeometry(1.2, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x757575, roughness: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.6;
    return mesh;
  }

  // ── Lighting ───────────────────────────────────────────────

  private buildLighting(): void {
    // Warm ambient (jungle dappled light)
    const ambient = new THREE.AmbientLight(0xffe0b2, 0.5);
    this.scene.add(ambient);

    // Main directional — sun poking through canopy
    const sun = new THREE.DirectionalLight(0xfff8e1, 0.9);
    sun.position.set(60, 100, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 400;
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;
    this.scene.add(sun);

    // Soft fill from opposite side
    const fill = new THREE.DirectionalLight(0xb2dfdb, 0.3);
    fill.position.set(-15, 20, -10);
    this.scene.add(fill);
  }

  // ── Render loop ────────────────────────────────────────────

  private startLoop(): void {
    this.ngZone.runOutsideAngular(() => this.tick());
  }

  private tick = (): void => {
    if (this.disposed) return;
    this.animationFrameId = requestAnimationFrame(this.tick);

    const delta = this.clock.getDelta();
    this.onTick?.(delta);
    this.renderer.render(this.scene, this.camera);
  };
}
