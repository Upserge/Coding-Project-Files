import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { MapService } from '../services/map.service';
import { MapConfig, ObstaclePlacement, DecorationPlacement, WaterPlacement, OBSTACLE_CONFIGS, ObstacleType, DecorationType } from '../models/map.model';
import { buildObstacleMesh } from './mesh/obstacle/obstacle-registry';
import { buildGroundMaterial } from './mesh/ground-texture.builder';
import { buildDecorationMesh } from './mesh/decoration-mesh.builder';
import { buildWaterMesh } from './mesh/water-mesh.builder';
import { buildEnvironmentMap } from './mesh/environment-light.builder';
import {
  applyHeightmap,
  TERRAIN_SEGMENTS,
} from './mesh/terrain-heightmap.builder';
import { buildInstancedGrass, tickInstancedGrass } from './mesh/instanced-grass.builder';
import { buildDappledLight } from './mesh/dappled-light.builder';
import { buildPondCaustics, buildStreamCaustics } from './mesh/water-caustics.builder';
import { buildContactShadows } from './mesh/contact-shadow.builder';
import { placeOnTerrain } from './mesh/terrain-placement';
import { getWaterSurfaceSize } from '../models/water-feature.model';
import { TimeOfDayService } from './animation/time-of-day.service';
import { ScreenShakeService } from './animation/screen-shake.service';
import { GlbLoaderService } from './mesh/glb-loader.service';
import { initVehicleLoader } from './mesh/obstacle/vehicle.builder';
import { VEHICLE_GLB_ENTRIES } from './mesh/vehicle-model.config';

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

    await this.buildJungleScene();

    // Guarantee the scene always has lighting even if buildLighting() failed
    if (!this.sunLight) {
      this.sunLight = this.buildSun();
      this.scene.add(this.sunLight);
      this.scene.add(this.sunLight.target);
    }
    if (!this.ambientLight) {
      this.ambientLight = this.buildAmbient();
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

  // ── Jungle scene ───────────────────────────────────────────

  private async buildJungleScene(): Promise<void> {
    const map = this.mapService.generateJungleMap();
    const safe = (label: string, fn: () => void) => {
      try { fn(); } catch (e) { console.error(`[Engine] ${label} failed:`, e); }
    };
    safe('buildGround',          () => this.buildGround(map));
    safe('buildDappledLight',    () => this.buildDappledLight());
    await this.preloadVehicleModels();
    safe('buildObstacles',       () => this.buildObstacles(map));
    safe('buildDecorations',     () => this.buildDecorations(map));
    safe('buildWater',           () => this.buildWater(map));
    safe('buildInstancedGrass',  () => this.buildInstancedGrass(map));
    safe('buildLighting',        () => this.buildLighting());
    safe('buildContactShadows',  () => this.buildContactShadows());
  }

  private async preloadVehicleModels(): Promise<void> {
    initVehicleLoader(this.glbLoader);
    try {
      await this.glbLoader.preloadAll(VEHICLE_GLB_ENTRIES);
    } catch (e) {
      console.warn('[Engine] Vehicle GLB preload failed — fallback boxes will be used', e);
    }
  }

  private buildDappledLight(): void {
    this.scene.add(buildDappledLight());
  }

  private buildGround(map: MapConfig): void {
    const geo = new THREE.PlaneGeometry(
      map.width,
      map.depth,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS,
    );
    applyHeightmap(geo);
    const ground = new THREE.Mesh(geo, buildGroundMaterial());
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.renderOrder = 0;
    this.scene.add(ground);
  }

  private buildObstacles(map: MapConfig): void {
    for (const obs of map.obstacles) {
      this.placeObstacle(obs);
    }
  }

  private placeObstacle(obs: ObstaclePlacement): void {
    const group = buildObstacleMesh(obs.type);
    if (!group) return;
    placeOnTerrain(
      group,
      obs.position.x,
      obs.position.z,
      obs.rotationY,
      this.getObstacleFootprint(obs.type),
      {
        alignToSlope: this.shouldAlignObstacleToSlope(obs.type),
        clearance: this.getObstacleClearance(obs.type) + obs.position.y,
        sampleRadius: this.getObstacleSampleRadius(obs.type),
      },
    );
    group.renderOrder = 2;
    this.enableShadows(group);
    this.scene.add(group);
    this.obstacleMeshes.set(obs.id, group);
  }

  private enableShadows(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }

  private buildDecorations(map: MapConfig): void {
    for (const deco of map.decorations) {
      this.placeDecoration(deco);
    }
  }

  private placeDecoration(deco: DecorationPlacement): void {
    const group = buildDecorationMesh(deco.type);
    if (!group) return;
    group.scale.setScalar(deco.scale);
    placeOnTerrain(
      group,
      deco.position.x,
      deco.position.z,
      deco.rotationY,
      this.getDecorationFootprint(deco.type, deco.scale),
      { alignToSlope: this.shouldAlignDecorationToSlope(deco.type), clearance: deco.position.y },
    );
    group.renderOrder = 1;
    this.scene.add(group);
  }

  private buildWater(map: MapConfig): void {
    for (const water of map.waterFeatures) {
      this.placeWaterFeature(water);
    }
  }

  private placeWaterFeature(water: WaterPlacement): void {
    const group = buildWaterMesh(water.type, water.size);
    if (!group) return;
    const surfaceSize = getWaterSurfaceSize(water);
    const caustic = water.type === 'pond'
      ? buildPondCaustics(water.size)
      : buildStreamCaustics(water.size);
    group.add(caustic);
    placeOnTerrain(
      group,
      water.position.x,
      water.position.z,
      water.rotationY,
      { width: surfaceSize.width, depth: surfaceSize.length },
      { alignToSlope: false, clearance: water.position.y, useFooting: false },
    );
    this.scene.add(group);
  }

  private buildContactShadows(): void {
    buildContactShadows(this.scene);
  }

  private getObstacleFootprint(type: ObstacleType): { width: number; depth: number } {
    const size = OBSTACLE_CONFIGS[type].size;
    return { width: size.x, depth: size.z };
  }

  private getObstacleClearance(type: ObstacleType): number {
    if (type === 'hole') return 0;
    return this.isVehicle(type) ? 0.08 : 0.02;
  }

  private shouldAlignObstacleToSlope(type: ObstacleType): boolean {
    return type !== 'tree' && type !== 'bush' && type !== 'hole';
  }

  private getObstacleSampleRadius(type: ObstacleType): number | undefined {
    return this.isVehicle(type) ? 1.8 : undefined;
  }

  private isVehicle(type: ObstacleType): boolean {
    return type === 'sedan';
  }

  private getDecorationFootprint(type: DecorationType, scale: number): { width: number; depth: number } {
    const size = type === 'fallen_log' ? { width: 1.9, depth: 0.7 } : { width: 0.9, depth: 0.9 };
    return { width: size.width * scale, depth: size.depth * scale };
  }

  private shouldAlignDecorationToSlope(type: DecorationType): boolean {
    return type === 'fallen_log' || type === 'vine';
  }

  // ── Instanced grass ───────────────────────────────────────

  private buildInstancedGrass(map: MapConfig): void {
    this.grassMesh = buildInstancedGrass(map.width, map.depth);
    this.grassMesh.renderOrder = 1;
    this.scene.add(this.grassMesh);
  }

  // ── Lighting ───────────────────────────────────────────────

  private buildLighting(): void {
    this.ambientLight = this.buildAmbient();
    this.scene.add(this.ambientLight);
    this.sunLight = this.buildSun();
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
    this.scene.add(this.buildFill());
    this.applyEnvironmentMap();
    this.timeOfDay.init(this.scene, this.sunLight, this.ambientLight);
  }

  private buildAmbient(): THREE.AmbientLight {
    return new THREE.AmbientLight(0xe8edd8, 0.4);
  }

  private buildSun(): THREE.DirectionalLight {
    const sun = new THREE.DirectionalLight(0xfff4d6, 0.72);
    sun.position.set(60, 100, 40);
    sun.castShadow = true;
    this.configureSunShadow(sun);
    return sun;
  }

  private configureSunShadow(sun: THREE.DirectionalLight): void {
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 400;
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0005;
    sun.shadow.radius = 3;
  }

  private buildFill(): THREE.DirectionalLight {
    const fill = new THREE.DirectionalLight(0xc7ddd6, 0.34);
    fill.position.set(-15, 20, -10);
    return fill;
  }

  /** Apply procedural IBL for realistic ambient reflections on all PBR materials. */
  private applyEnvironmentMap(): void {
    this.scene.environment = buildEnvironmentMap();
    this.scene.environmentIntensity = 0.34;
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
