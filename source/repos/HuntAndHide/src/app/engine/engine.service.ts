import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { MapService } from '../services/map.service';
import { clearWaterDepressions } from './mesh/terrain-heightmap.builder';
import { tickInstancedGrass } from './mesh/instanced-grass.builder';
import { TimeOfDayService } from './animation/time-of-day.service';
import { ScreenShakeService } from './animation/screen-shake.service';
import { GlbLoaderService } from './mesh/glb-loader.service';
import { buildJungleScene } from './engine-scene.builder';
import { buildEngineLighting, buildSun, buildAmbient } from './engine-lighting.builder';

/**
 * EngineService owns the Three.js render loop and scene graph.
 *
 * Uses a true-isometric OrthographicCamera (≈30° from ground).
 * WebGPU path attempted first via dynamic import, with WebGL fallback.
 */
@Injectable({ providedIn: 'root' })
export class EngineService implements OnDestroy {
  private readonly mapService = inject(MapService);
  private readonly timeOfDay = inject(TimeOfDayService);
  private readonly screenShake = inject(ScreenShakeService);
  private readonly glbLoader = inject(GlbLoaderService);

  // ── Core Three.js objects ──────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private clock = new THREE.Clock();
  private animationFrameId = 0;
  private disposed = false;
  private grassMesh: THREE.InstancedMesh | null = null;
  private grassElapsed = 0;
  private sunLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  /** Obstacle scene meshes keyed by ObstaclePlacement.id. */
  private obstacleMeshes = new Map<string, THREE.Group>();

  /** External tick callback — GameLoopService registers here. */
  onTick: ((delta: number) => void) | null = null;

  constructor(private ngZone: NgZone) {}

  // ── Public API ─────────────────────────────────────────────

  async init(canvas: HTMLCanvasElement): Promise<void> {
    // Reset lifecycle flag so the render loop can run after a previous dispose
    this.disposed = false;
    cancelAnimationFrame(this.animationFrameId);
    this.clock = new THREE.Clock();
    this.grassElapsed = 0;
    this.onTick = null;
    this.grassMesh = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.obstacleMeshes.clear();

    this.createScene();
    this.createCamera(canvas.clientWidth, canvas.clientHeight);
    await this.createRenderer(canvas);

    const result = await buildJungleScene(this.scene, this.mapService.generateJungleMap(), this.glbLoader);
    this.obstacleMeshes = result.obstacleMeshes;
    this.grassMesh = result.grassMesh;

    const lighting = buildEngineLighting(this.scene, this.timeOfDay);
    this.sunLight = lighting.sunLight;
    this.ambientLight = lighting.ambientLight;

    // Guarantee fallback lighting if the builder failed
    if (!this.sunLight) {
      this.sunLight = buildSun();
      this.scene.add(this.sunLight);
      this.scene.add(this.sunLight.target);
    }
    if (!this.ambientLight) {
      this.ambientLight = buildAmbient();
      this.scene.add(this.ambientLight);
    }

    this.startLoop();
  }

  getScene(): THREE.Scene { return this.scene; }
  getCamera(): THREE.OrthographicCamera { return this.camera; }

  /** Look up an obstacle mesh by its placement ID. */
  getObstacleMesh(obstacleId: string): THREE.Group | undefined {
    return this.obstacleMeshes.get(obstacleId);
  }

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

  /** Trigger a camera shake effect (called externally on catch events). */
  triggerShake(intensity = 0.35, duration = 0.3): void {
    this.screenShake.trigger(intensity, duration);
  }

  /** Move camera to follow a target position while keeping isometric angle. */
  followTarget(target: { x: number; y: number; z: number }, delta: number): void {
    // Advance screen shake before applying offset
    this.screenShake.tick(delta);
    const shake = this.screenShake.getOffset();

    const isoDistance = 30;
    const angle = Math.PI / 6;  // 30°
    const yaw = Math.PI / 4;    // 45°
    this.camera.position.set(
      target.x + isoDistance * Math.cos(angle) * Math.sin(yaw) + shake.x,
      target.y + isoDistance * Math.sin(angle) + shake.y,
      target.z + isoDistance * Math.cos(angle) * Math.cos(yaw) + shake.z,
    );
    this.camera.lookAt(target.x, target.y, target.z);

    // Keep the sun centred on the player so the shadow frustum covers the visible area
    if (this.sunLight) {
      this.sunLight.position.set(target.x + 60, target.y + 100, target.z + 40);
      this.sunLight.target.position.set(target.x, target.y, target.z);
      this.sunLight.target.updateMatrixWorld();
    }
  }

  ngOnDestroy(): void { this.dispose(); }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.animationFrameId);
    this.timeOfDay.dispose();
    clearWaterDepressions();
    this.renderer?.dispose();
  }

  // ── Scene setup ────────────────────────────────────────────

  private createScene(): void {
    this.scene = new THREE.Scene();
    // Sky-blue background with warm tone (sun poking through canopy)
    this.scene.background = new THREE.Color(0x87ceaa);
    // Enable layer 1 so the overlay pass can traverse into player groups
    this.scene.layers.enable(1);
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
    this.camera.layers.enable(1);
  }

  private async createRenderer(canvas: HTMLCanvasElement): Promise<void> {
    // WebGL renderer — reliable shadows, post-processing, and onBeforeCompile support.
    // WebGPU is experimental in Three.js 0.183 and breaks shadow-map frustum settings.
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.configureRenderer();
    console.log('[Engine] WebGL renderer active');
  }

  /** Apply tone mapping, colour management, and shadow quality settings. */
  private configureRenderer(): void {
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  // ── Render loop ────────────────────────────────────────────

  private startLoop(): void {
    this.ngZone.runOutsideAngular(() => this.tick());
  }

  private tick = (): void => {
    if (this.disposed) return;
    this.animationFrameId = requestAnimationFrame(this.tick);

    try {
      const delta = this.clock.getDelta();
      this.onTick?.(delta);

      // Advance instanced grass wind animation
      this.grassElapsed += delta;
      if (this.grassMesh) tickInstancedGrass(this.grassMesh, this.grassElapsed);

      // Advance time-of-day lighting cycle
      this.timeOfDay.tick(delta);

      this.renderer.render(this.scene, this.camera);
    } catch (e) {
      // Fallback: attempt direct render so the screen is never blank
      try { this.renderer.render(this.scene, this.camera); } catch {}
    }
  };
}
