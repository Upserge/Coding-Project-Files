import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { getTerrainHeight } from '../mesh/terrain-heightmap.builder';

/**
 * GroundFogService adds a low-lying animated fog layer to the scene.
 *
 * The fog plane is vertex-displaced to follow the terrain heightmap
 * so mist settles into valleys and thins out on hills.
 *
 * Call `init(scene)` once, then `tick(delta)` every frame.
 */

const FOG_SIZE = 500;
const FOG_OFFSET_Y = 0.35;
const FOG_SEGMENTS = 128;

@Injectable({ providedIn: 'root' })
export class GroundFogService {

  private mesh: THREE.Mesh | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private elapsed = 0;

  init(scene: THREE.Scene): void {
    this.elapsed = 0;
    const geo = new THREE.PlaneGeometry(FOG_SIZE, FOG_SIZE, FOG_SEGMENTS, FOG_SEGMENTS);
    this.displaceToTerrain(geo);
    this.material = this.createFogMaterial();
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
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

  private displaceToTerrain(geo: THREE.PlaneGeometry): void {
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const heights = new Float32Array(pos.count);
    let minH = Infinity;
    let maxH = -Infinity;

    for (let i = 0; i < pos.count; i++) {
      const localX = pos.getX(i);
      const localY = pos.getY(i);
      const worldZ = -localY;
      const h = getTerrainHeight(localX, worldZ);
      pos.setZ(i, h + FOG_OFFSET_Y);
      heights[i] = h;
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const range = maxH - minH || 1;
    const heightAttr = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      heightAttr[i] = (heights[i] - minH) / range;
    }
    geo.setAttribute('aHeightT', new THREE.BufferAttribute(heightAttr, 1));
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
        attribute float aHeightT;
        varying vec2 vUv;
        varying float vHeightT;
        void main() {
          vUv = uv;
          vHeightT = aHeightT;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        varying float vHeightT;

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
          float alpha = (n * 0.6 + n2 * 0.4) * 0.32;

          // Thick in valleys (heightT~0), thin on hills (heightT~1)
          float heightFade = 1.0 - smoothstep(0.15, 0.65, vHeightT);
          alpha *= heightFade;

          // Fade out at world edges
          vec2 edge = smoothstep(vec2(0.0), vec2(0.15), vUv)
                    * smoothstep(vec2(0.0), vec2(0.15), 1.0 - vUv);
          alpha *= edge.x * edge.y;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
  }
}
