import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { MapService } from '../services/map.service';
import { MapConfig, ObstaclePlacement, DecorationPlacement, WaterPlacement } from '../models/map.model';
import { buildObstacleMesh } from './mesh/obstacle/obstacle-registry';
import { buildGroundMaterial } from './mesh/ground-texture.builder';
import { buildDecorationMesh } from './mesh/decoration-mesh.builder';
import { buildWaterMesh } from './mesh/water-mesh.builder';
import { PostProcessingService } from './post-processing.service';
import { buildEnvironmentMap } from './mesh/environment-light.builder';
import { applyHeightmap, getTerrainHeight } from './mesh/terrain-heightmap.builder';
import { buildInstancedGrass, tickInstancedGrass } from './mesh/instanced-grass.builder';
import { buildGodRays, tickGodRays } from './mesh/god-ray.builder';
import { buildDappledLight } from './mesh/dappled-light.builder';
import { buildPondCaustics, buildStreamCaustics, tickCaustics } from './mesh/water-caustics.builder';
import { buildContactShadows } from './mesh/contact-shadow.builder';
import { GroundFogService } from './animation/ground-fog.service';
import { TimeOfDayService } from './animation/time-of-day.service';
import { ScreenShakeService } from './animation/screen-shake.service';

/**
 * EngineService owns the Three.js render loop and scene graph.
 *
 * Uses a true-isometric OrthographicCamera (≈30° from ground).
 * WebGPU path attempted first via dynamic import, with WebGL fallback.
 */
@Injectable({ providedIn: 'root' })
export class EngineService implements OnDestroy {
  private readonly mapService = inject(MapService);
  private readonly postProcessing = inject(PostProcessingService);
  private readonly groundFog = inject(GroundFogService);
  private readonly timeOfDay = inject(TimeOfDayService);
  private readonly screenShake = inject(ScreenShakeService);

  // ── Core Three.js objects ──────────────────────────────────
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private clock = new THREE.Clock();
  private animationFrameId = 0;
  private disposed = false;
  private usePostProcessing = false;
  private grassMesh: THREE.InstancedMesh | null = null;
  private grassElapsed = 0;
  private godRayElapsed = 0;
  private causticsElapsed = 0;
  private ppElapsed = 0;
  private sunLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

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
    this.godRayElapsed = 0;
    this.causticsElapsed = 0;
    this.ppElapsed = 0;
    this.onTick = null;
    this.usePostProcessing = false;
    this.grassMesh = null;
    this.sunLight = null;
    this.ambientLight = null;

    this.createScene();
    this.createCamera(canvas.clientWidth, canvas.clientHeight);
    await this.createRenderer(canvas);

    this.buildJungleScene();

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

    this.initPostProcessing();
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
    if (this.usePostProcessing) {
      this.postProcessing.resize(width, height);
    }
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
    if (this.usePostProcessing) {
      this.postProcessing.dispose();
    }
    this.groundFog.dispose();
    this.timeOfDay.dispose();
    this.renderer?.dispose();
  }

  // ── Scene setup ────────────────────────────────────────────

  private createScene(): void {
    this.scene = new THREE.Scene();
    // Sky-blue background with warm tone (sun poking through canopy)
    this.scene.background = new THREE.Color(0x87ceaa);
    this.scene.fog = new THREE.FogExp2(0x87ceaa, 0.003);
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

  /** Initialise the EffectComposer post-processing pipeline. */
  private initPostProcessing(): void {
    try {
      this.postProcessing.init(this.renderer, this.scene, this.camera, this.sunLight ?? undefined);
      this.usePostProcessing = true;
    } catch (e) {
      console.warn('[Engine] Post-processing init failed, using direct rendering', e);
      this.usePostProcessing = false;
    }
  }

  // ── Jungle scene ───────────────────────────────────────────

  private buildJungleScene(): void {
    const map = this.mapService.generateJungleMap();
    const safe = (label: string, fn: () => void) => {
      try { fn(); } catch (e) { console.error(`[Engine] ${label} failed:`, e); }
    };
    safe('buildGround',          () => this.buildGround(map));
    safe('buildDappledLight',    () => this.buildDappledLight());
    safe('buildObstacles',       () => this.buildObstacles(map));
    safe('buildDecorations',     () => this.buildDecorations(map));
    safe('buildWater',           () => this.buildWater(map));
    safe('buildInstancedGrass',  () => this.buildInstancedGrass(map));
    safe('buildGodRays',         () => this.buildGodRays());
    safe('buildLighting',        () => this.buildLighting());
    safe('buildContactShadows',  () => this.buildContactShadows());
    safe('groundFog.init',       () => this.groundFog.init(this.scene));
  }

  private buildDappledLight(): void {
    this.scene.add(buildDappledLight());
  }

  private buildGround(map: MapConfig): void {
    const geo = new THREE.PlaneGeometry(map.width, map.depth, 64, 64);
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
    const y = obs.position.y + getTerrainHeight(obs.position.x, obs.position.z);
    group.position.set(obs.position.x, y, obs.position.z);
    group.rotation.y = obs.rotationY;
    group.renderOrder = 2;
    this.enableShadows(group);
    this.scene.add(group);
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
    const y = deco.position.y + getTerrainHeight(deco.position.x, deco.position.z);
    group.position.set(deco.position.x, y, deco.position.z);
    group.rotation.y = deco.rotationY;
    group.scale.setScalar(deco.scale);
    group.renderOrder = 1;
    group.traverse((child) => {
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.Material;
        mat.depthWrite = false;
      }
    });
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
    group.position.set(water.position.x, water.position.y, water.position.z);
    group.rotation.y = water.rotationY;
    this.scene.add(group);

    // Add caustic overlay
    const caustic = water.type === 'pond'
      ? buildPondCaustics(water.size)
      : buildStreamCaustics(water.size);
    caustic.position.copy(group.position);
    caustic.rotation.y = water.rotationY;
    this.scene.add(caustic);
  }

  private buildContactShadows(): void {
    buildContactShadows(this.scene);
  }

  // ── Instanced grass + god rays ─────────────────────────────

  private buildInstancedGrass(map: MapConfig): void {
    this.grassMesh = buildInstancedGrass(map.width, map.depth);
    this.grassMesh.renderOrder = 1;
    this.scene.add(this.grassMesh);
  }

  private buildGodRays(): void {
    this.scene.add(buildGodRays());
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
    return new THREE.AmbientLight(0xffe0b2, 0.5);
  }

  private buildSun(): THREE.DirectionalLight {
    const sun = new THREE.DirectionalLight(0xfff8e1, 0.9);
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
    const fill = new THREE.DirectionalLight(0xb2dfdb, 0.3);
    fill.position.set(-15, 20, -10);
    return fill;
  }

  /** Apply procedural IBL for realistic ambient reflections on all PBR materials. */
  private applyEnvironmentMap(): void {
    this.scene.environment = buildEnvironmentMap();
    this.scene.environmentIntensity = 0.4;
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

      // Advance god ray breathing animation
      this.godRayElapsed += delta;
      tickGodRays(this.godRayElapsed);

      // Advance water caustics animation
      this.causticsElapsed += delta;
      tickCaustics(this.causticsElapsed);

      // Advance ground fog drift
      this.groundFog.tick(delta);

      // Advance time-of-day lighting cycle
      this.timeOfDay.tick(delta);

      // Advance post-processing per-frame uniforms
      this.ppElapsed += delta;
      if (this.usePostProcessing) {
        this.postProcessing.tick(this.ppElapsed);
        this.postProcessing.render();

        // Overlay pass: render UI-layer sprites (name labels) directly on top,
        // bypassing all post-processing so god rays / tilt-shift don't ghost them.
        // Null out background & fog so they don't overwrite the post-processed image,
        // and clear depth so sprites aren't rejected by the composer's fullscreen quad.
        this.renderer.autoClear = false;
        const savedBg = this.scene.background;
        const savedFog = this.scene.fog;
        this.scene.background = null;
        this.scene.fog = null;
        this.camera.layers.set(1);
        this.renderer.clearDepth();
        this.renderer.render(this.scene, this.camera);
        this.scene.background = savedBg;
        this.scene.fog = savedFog;
        this.camera.layers.set(0);
        this.renderer.autoClear = true;
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (e) {
      // Fallback: attempt direct render so the screen is never blank
      try { this.renderer.render(this.scene, this.camera); } catch {}
    }
  };
}
