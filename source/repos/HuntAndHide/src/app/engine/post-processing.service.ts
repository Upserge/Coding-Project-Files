import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/** Bloom tuning. */
const BLOOM_STRENGTH = 0.25;
const BLOOM_RADIUS = 0.4;
const BLOOM_THRESHOLD = 0.85;

/**
 * PostProcessingService manages a Three.js EffectComposer pipeline.
 *
 * Passes:
 *   1. RenderPass          — standard scene render
 *   2. UnrealBloomPass     — glow on bright surfaces (fireflies, water)
 *   3. ColorGrading        — contrast, saturation, vignette, warm shift
 *   4. TiltShift           — depth-of-field miniature/diorama effect
 *   5. ChromaticAberration — RGB channel offset + film grain
 *   6. SMAAPass            — subpixel anti-aliasing (last)
 *
 * God rays are handled by mesh-based volumetric shafts (god-ray.builder).
 *
 * Lifecycle:
 *   init(renderer, scene, camera) → tick(elapsed) each frame → resize(w,h) → dispose()
 */
@Injectable({ providedIn: 'root' })
export class PostProcessingService {

  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private smaaPass: SMAAPass | null = null;
  private chromaticPass: ShaderPass | null = null;

  init(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void {
    this.composer = new EffectComposer(renderer);
    this.addRenderPass(scene, camera);
    this.addBloomPass(renderer);
    this.addColorGradingPass();
    this.addTiltShiftPass();
    this.addChromaticAberrationPass();
    this.addSmaaPass();
  }

  /** Update uniforms that change per-frame. */
  tick(elapsed: number): void {
    if (this.chromaticPass) {
      this.chromaticPass.uniforms['uTime'].value = elapsed;
    }
  }

  /** Render the full post-processing pipeline for one frame. */
  render(): void {
    this.composer?.render();
  }

  resize(width: number, height: number): void {
    this.composer?.setSize(width, height);
  }

  dispose(): void {
    this.bloomPass?.dispose();
    this.smaaPass?.dispose();
    this.composer = null;
    this.bloomPass = null;
    this.smaaPass = null;
    this.chromaticPass = null;
  }

  // ── Pass construction ─────────────────────────────────────

  private addRenderPass(scene: THREE.Scene, camera: THREE.Camera): void {
    this.composer!.addPass(new RenderPass(scene, camera));
  }

  private addBloomPass(renderer: THREE.WebGLRenderer): void {
    const size = renderer.getSize(new THREE.Vector2());
    this.bloomPass = new UnrealBloomPass(size, BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD);
    this.composer!.addPass(this.bloomPass);
  }

  private addColorGradingPass(): void {
    const pass = new ShaderPass(COLOR_GRADING_SHADER);
    this.composer!.addPass(pass);
  }

  private addTiltShiftPass(): void {
    const pass = new ShaderPass(TILT_SHIFT_SHADER);
    this.composer!.addPass(pass);
  }

  private addChromaticAberrationPass(): void {
    this.chromaticPass = new ShaderPass(CHROMATIC_FILM_SHADER);
    this.composer!.addPass(this.chromaticPass);
  }

  private addSmaaPass(): void {
    this.smaaPass = new SMAAPass();
    this.composer!.addPass(this.smaaPass);
  }
}

// ── Color grading shader ────────────────────────────────────

const COLOR_GRADING_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Brightness
      color.rgb += 0.02;

      // Contrast
      color.rgb = (color.rgb - 0.5) * 1.05 + 0.5;

      // Saturation
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(gray), color.rgb, 1.15);

      // Warm shift
      color.r *= 1.03;
      color.b *= 0.97;

      // Vignette (subtle — never darken below 70%)
      vec2 uv = vUv * (1.0 - vUv);
      float vig = uv.x * uv.y * 15.0;
      color.rgb *= clamp(pow(vig, 0.55), 0.7, 1.0);

      gl_FragColor = color;
    }
  `,
};

// ── Tilt-shift depth of field ───────────────────────────────

const TILT_SHIFT_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    blurAmount: { value: 1.2 }, // 1.2
    focalCenter: { value: 0.5 },
    focalRange: { value: 0.25 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float blurAmount;
    uniform float focalCenter;
    uniform float focalRange;
    varying vec2 vUv;

    void main() {
      float dist = abs(vUv.y - focalCenter);
      float strength = smoothstep(focalRange * 0.5, focalRange, dist);
      float blur = strength * blurAmount / 512.0;

      vec4 color = vec4(0.0);
      float total = 0.0;
      for (int i = -4; i <= 4; i++) {
        float fi = float(i);
        float w = 1.0 - abs(fi) / 4.0;
        color += texture2D(tDiffuse, vUv + vec2(0.0, fi * blur)) * w;
        total += w;
      }
      gl_FragColor = color / total;
    }
  `,
};

// ── Chromatic aberration + film grain ───────────────────────

const CHROMATIC_FILM_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    chromaticStrength: { value: 0.002 },
    grainStrength: { value: 0.06 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float chromaticStrength;
    uniform float grainStrength;
    varying vec2 vUv;

    float random(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      // Distance from center for chromatic strength falloff
      vec2 center = vUv - 0.5;
      float dist = length(center);
      float offset = chromaticStrength * dist;
      vec2 dir = normalize(center + 0.0001);

      float r = texture2D(tDiffuse, vUv + dir * offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - dir * offset).b;
      float a = texture2D(tDiffuse, vUv).a;

      vec4 color = vec4(r, g, b, a);

      // Film grain
      float grain = (random(vUv + fract(uTime)) - 0.5) * grainStrength;
      color.rgb += grain;

      gl_FragColor = color;
    }
  `,
};
