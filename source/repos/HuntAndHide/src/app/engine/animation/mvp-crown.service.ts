import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * MvpCrownService attaches / detaches floating MVP indicators
 * on player meshes each frame:
 * - Devil horns (glowing red) for the MVP Hunter
 * - Heavenly halo (soft gold glow) for the MVP Hider
 *
 * Both ornaments bob gently and emit a soft point-light.
 */
@Injectable({ providedIn: 'root' })
export class MvpCrownService {
  private readonly hornTag = '__mvp_horns__';
  private readonly haloTag = '__mvp_halo__';

  private elapsed = 0;

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
    const existing = group.getObjectByName(this.hornTag);
    if (shouldHave && !existing) return void this.attachHorns(group);
    if (!shouldHave && existing) return void this.detachByTag(group, this.hornTag);
  }

  private attachHorns(group: THREE.Group): void {
    const horns = new THREE.Group();
    horns.name = this.hornTag;

    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xcc2222,
      emissive: 0xff4444,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.4,
    });

    for (const side of [-1, 1]) {
      const horn = this.buildHorn(hornMat);
      horn.position.set(side * 0.3, 0, 0.02);
      horn.rotation.z = side * 0.35;
      horns.add(horn);

      const hornGlow = this.buildHornGlow();
      hornGlow.position.copy(horn.position);
      hornGlow.rotation.copy(horn.rotation);
      horns.add(hornGlow);
    }

    const glow = new THREE.PointLight(0xff3b3b, 1.6, 5.8);
    glow.position.set(0, 0.25, 0.05);
    horns.add(glow);

    horns.position.set(0, 2.28, 0);
    horns.renderOrder = 101;
    group.add(horns);
  }

  private buildHorn(mat: THREE.Material): THREE.Mesh {
    const geo = new THREE.ConeGeometry(0.1, 0.48, 10);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -0.2;
    return mesh;
  }

  private buildHornGlow(): THREE.Mesh {
    const glow = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.62, 12),
      this.buildFresnelMaterial(0xff2a2a, 3.2),
    );
    glow.rotation.x = -0.2;
    return glow;
  }

  // ── Heavenly Halo (MVP Hider) ─────────────────────────────

  private syncHalo(group: THREE.Group, shouldHave: boolean): void {
    const existing = group.getObjectByName(this.haloTag);
    if (shouldHave && !existing) return void this.attachHalo(group);
    if (!shouldHave && existing) return void this.detachByTag(group, this.haloTag);
  }

  private attachHalo(group: THREE.Group): void {
    const halo = new THREE.Group();
    halo.name = this.haloTag;

    const ringGeo = new THREE.TorusGeometry(0.28, 0.04, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffe9a0,
      emissive: 0xffe066,
      emissiveIntensity: 1.0,
      roughness: 0.2,
      metalness: 0.6,
      transparent: true,
      opacity: 0.85,
    });

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    halo.add(ring);

    const ringGlow = this.buildHaloGlow();
    halo.add(ringGlow);

    const glow = new THREE.PointLight(0xffe066, 0.8, 3.5);
    glow.position.set(0, 0.15, 0);
    halo.add(glow);

    halo.position.set(0, 2.2, 0);
    halo.renderOrder = 101;
    group.add(halo);
  }

  private buildHaloGlow(): THREE.Mesh {
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(0.31, 0.065, 16, 40),
      this.buildFresnelMaterial(0xffef9a, 2.6),
    );
    glow.rotation.x = Math.PI / 2;
    return glow;
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
    if (hunterUid) this.animateIfPresent(meshes.get(hunterUid), this.hornTag, 3.0, 0.06);
    if (hiderUid) this.animateIfPresent(meshes.get(hiderUid), this.haloTag, 2.0, 0.04);
  }

  private animateIfPresent(
    group: THREE.Group | undefined,
    tag: string,
    speed: number,
    amplitude: number,
  ): void {
    const ornament = group?.getObjectByName(tag);
    if (!ornament) return;
    const baseY = tag === this.hornTag ? 2.28 : 2.2;
    ornament.position.y = baseY + Math.sin(this.elapsed * speed) * amplitude;
  }

  // ── Cleanup ───────────────────────────────────────────────

  private detachByTag(group: THREE.Group, tag: string): void {
    const obj = group.getObjectByName(tag);
    if (!obj) return;
    group.remove(obj);
    obj.traverse((child: any) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  dispose(meshes: Map<string, THREE.Group>): void {
    for (const [, group] of meshes) {
      this.detachByTag(group, this.hornTag);
      this.detachByTag(group, this.haloTag);
    }
    this.elapsed = 0;
  }
}
