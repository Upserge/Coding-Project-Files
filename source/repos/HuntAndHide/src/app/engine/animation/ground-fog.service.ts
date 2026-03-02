import { Injectable } from '@angular/core';
import * as THREE from 'three';

/**
 * GroundFogService adds a low-lying animated fog layer to the scene.
 *
 * A single transparent plane at y ≈ 0.4 with a noise-based alpha
 * shader gives the illusion of wispy jungle mist drifting across the
 * ground. One draw call, very cheap.
 *
 * Call `init(scene)` once, then `tick(delta)` every frame.
 */

const FOG_SIZE = 200;
const FOG_Y = 0.4;

@Injectable({ providedIn: 'root' })
export class GroundFogService {

  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private elapsed = 0;

  init(scene: THREE.Scene): void {
    const geo = new THREE.PlaneGeometry(FOG_SIZE, FOG_SIZE);
    this.material = this.createFogMaterial();
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = FOG_Y;
    this.mesh.renderOrder = 4;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  tick(delta: number): void {
    this.elapsed += delta;
    if (this.material) {
      this.material.uniforms['uTime'].value = this.elapsed;
    }
  }

  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material?.dispose();
    }
    this.mesh = null;
    this.material = null;
  }

  private createFogMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xc8dfc8) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;

        // Simple value noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv * 6.0;
          float drift = uTime * 0.06;
          float n = fbm(uv + vec2(drift, drift * 0.7));
          float n2 = fbm(uv * 1.3 + vec2(-drift * 0.5, drift * 0.4));
          float alpha = (n * 0.6 + n2 * 0.4) * 0.28;

          // Fade out at edges
          vec2 edge = smoothstep(vec2(0.0), vec2(0.15), vUv)
                    * smoothstep(vec2(0.0), vec2(0.15), 1.0 - vUv);
          alpha *= edge.x * edge.y;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
  }
}
