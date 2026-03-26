import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * MvpCrownService attaches / detaches floating MVP indicators
 * on player meshes each frame:
 * - Devil horns (glowing red) for the MVP Hunter
 * - Heavenly halo (soft gold glow) for the MVP Hider
 *
 * Performance notes:
 * - Geometries and materials are pre-built once (avoids shader recompilation).
 * - Ornament references tracked via Maps (avoids getObjectByName tree walks).
 * - No PointLights — emissive materials + fresnel glow are sufficient and
 *   avoid adding per-light render passes to every nearby mesh.
 */
@Injectable({ providedIn: 'root' })
export class MvpCrownService {
  private elapsed = 0;

  // ── Tracked ornament references (O(1) lookup, no tree walks) ──
  private readonly hornsMap = new Map<THREE.Group, THREE.Group>();
  private readonly halosMap = new Map<THREE.Group, THREE.Group>();

  // ── Cached geometries (built once) ────────────────────────
  private readonly hornGeo = new THREE.ConeGeometry(0.1, 0.48, 10);
  private readonly hornGlowGeo = new THREE.ConeGeometry(0.15, 0.62, 12);
  private readonly haloRingGeo = new THREE.TorusGeometry(0.28, 0.04, 12, 32);
  private readonly haloGlowGeo = new THREE.TorusGeometry(0.31, 0.065, 16, 40);

  // ── Cached materials (built once) ─────────────────────────
  private readonly hornMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    emissive: 0xff4444,
    emissiveIntensity: 1.2,
    roughness: 0.3,
    metalness: 0.4,
  });

  private readonly hornGlowMat = this.buildFresnelMaterial(0xff2a2a, 3.2);

  private readonly haloRingMat = new THREE.MeshStandardMaterial({
    color: 0xffe9a0,
    emissive: 0xffe066,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  private readonly haloGlowMat = this.buildFresnelMaterial(0xffef9a, 2.6);

  /** Update ornaments for all visible player meshes. */
  sync(
    playerMeshes: Map<string, THREE.Group>,
    mvpHunterUid: string | null,
    mvpHiderUid: string | null,
    delta: number,
  ): void {
    this.elapsed += delta;

    for (const [uid, group] of playerMeshes) {
      this.syncHorns(group, uid === mvpHunterUid);
      this.syncHalo(group, uid === mvpHiderUid);
    }

    this.animateOrnaments(playerMeshes, mvpHunterUid, mvpHiderUid);
  }

  // ── Devil Horns (MVP Hunter) ──────────────────────────────

  private syncHorns(group: THREE.Group, shouldHave: boolean): void {
    const existing = this.hornsMap.has(group);
    if (shouldHave && !existing) return void this.attachHorns(group);
    if (!shouldHave && existing) return void this.detachHorns(group);
  }

  private attachHorns(group: THREE.Group): void {
    const horns = new THREE.Group();

    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(this.hornGeo, this.hornMat);
      horn.rotation.x = -0.2;
      horn.position.set(side * 0.3, 0, 0.02);
      horn.rotation.z = side * 0.35;
      horns.add(horn);

      const glow = new THREE.Mesh(this.hornGlowGeo, this.hornGlowMat);
      glow.rotation.x = -0.2;
      glow.position.copy(horn.position);
      glow.rotation.z = horn.rotation.z;
      horns.add(glow);
    }

    horns.position.set(0, 2.28, 0);
    horns.renderOrder = 101;
    group.add(horns);
    this.hornsMap.set(group, horns);
  }

  private detachHorns(group: THREE.Group): void {
    const horns = this.hornsMap.get(group);
    if (!horns) return;
    group.remove(horns);
    this.hornsMap.delete(group);
  }

  // ── Heavenly Halo (MVP Hider) ─────────────────────────────

  private syncHalo(group: THREE.Group, shouldHave: boolean): void {
    const existing = this.halosMap.has(group);
    if (shouldHave && !existing) return void this.attachHalo(group);
    if (!shouldHave && existing) return void this.detachHalo(group);
  }

  private attachHalo(group: THREE.Group): void {
    const halo = new THREE.Group();

    const ring = new THREE.Mesh(this.haloRingGeo, this.haloRingMat);
    ring.rotation.x = Math.PI / 2;
    halo.add(ring);

    const glow = new THREE.Mesh(this.haloGlowGeo, this.haloGlowMat);
    glow.rotation.x = Math.PI / 2;
    halo.add(glow);

    halo.position.set(0, 2.2, 0);
    halo.renderOrder = 101;
    group.add(halo);
    this.halosMap.set(group, halo);
  }

  private detachHalo(group: THREE.Group): void {
    const halo = this.halosMap.get(group);
    if (!halo) return;
    group.remove(halo);
    this.halosMap.delete(group);
  }

  private buildFresnelMaterial(color: number, power: number): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(color) },
        power: { value: power },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float power;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDir), 0.0), power);
          gl_FragColor = vec4(glowColor, fresnel * 0.95);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  // ── Animation ─────────────────────────────────────────────

  private animateOrnaments(
    meshes: Map<string, THREE.Group>,
    hunterUid: string | null,
    hiderUid: string | null,
  ): void {
    if (hunterUid) this.animateHorns(meshes.get(hunterUid));
    if (hiderUid) this.animateHalo(meshes.get(hiderUid));
  }

  private animateHorns(group: THREE.Group | undefined): void {
    if (!group) return;
    const horns = this.hornsMap.get(group);
    if (!horns) return;
    horns.position.y = 2.28 + Math.sin(this.elapsed * 3.0) * 0.06;
  }

  private animateHalo(group: THREE.Group | undefined): void {
    if (!group) return;
    const halo = this.halosMap.get(group);
    if (!halo) return;
    halo.position.y = 2.2 + Math.sin(this.elapsed * 2.0) * 0.04;
  }

  // ── Cleanup ───────────────────────────────────────────────

  dispose(meshes: Map<string, THREE.Group>): void {
    for (const [, group] of meshes) {
      this.detachHorns(group);
      this.detachHalo(group);
    }
    this.hornsMap.clear();
    this.halosMap.clear();
    this.elapsed = 0;
  }

  disposeResources(): void {
    this.hornGeo.dispose();
    this.hornGlowGeo.dispose();
    this.haloRingGeo.dispose();
    this.haloGlowGeo.dispose();
    this.hornMat.dispose();
    this.hornGlowMat.dispose();
    this.haloRingMat.dispose();
    this.haloGlowMat.dispose();
  }
}
