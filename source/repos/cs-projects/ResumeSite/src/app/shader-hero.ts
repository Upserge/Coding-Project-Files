function parseHexColor(hex: string): [number, number, number] {
  const raw = hex.trim().replace('#', '');
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  if (expanded.length !== 6) {
    return [0.49, 0.36, 1.0];
  }
  const value = parseInt(expanded, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function readThemeColor(varName: string, fallback: string): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return parseHexColor(raw || fallback);
}

const VERTEX_SHADER = `
  precision mediump float;
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform float time;
  uniform vec2 resolution;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 glowColor;
  uniform float opacity;
  uniform float pulse;
  uniform float phase;

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
    float value = 0.0;
    float amp = 0.55;
    for (int i = 0; i < 3; i++) {
      value += amp * noise(p);
      p *= 2.03;
      amp *= 0.48;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 centered = uv - 0.5;
    vec2 aspect = vec2(1.0, resolution.x / max(resolution.y, 1.0));
    float dist = length(centered * aspect * 2.0);
    float blobMask = 1.0 - smoothstep(0.58, 1.0, dist);

    vec2 localUv = centered * aspect * 1.35 + 0.5;
    float vignette = 1.0 - dot(centered, centered) * 0.55;

    float flow = fbm(localUv * 3.2 + vec2(time * 0.22 + phase, -time * 0.16));
    float streaks = fbm(localUv * 6.5 + vec2(-time * 0.14, time * 0.2 + phase * 0.7));
    float pattern = pow(mix(flow, streaks, 0.38), 1.12);

    vec3 base = mix(color1, color2, pattern);
    vec3 finalColor = mix(base, glowColor, pattern * 0.32 + pulse * 0.48);
    float alpha = (0.08 + 0.38 * pattern) * vignette * blobMask * opacity;
    alpha += pulse * 0.24 * pattern * vignette * blobMask;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const MAX_CLOUDS = 16;
const RENDER_EDGE = 320;
const FADE_SECONDS = 1.2;
const PULSE_MS = 650;
const AMBIENT_FRAME_MS = 1000 / 24;
const PULSE_FRAME_MS = 1000 / 45;
const VIEWPORT_MARGIN = 160;

interface AnchorSpec {
  selector: string;
  rx: number;
  ry: number;
  phase?: number;
}

interface CloudAnchor {
  element: HTMLElement;
  displayCanvas: HTMLCanvasElement;
  displayCtx: CanvasRenderingContext2D;
  rx: number;
  ry: number;
  phase: number;
  pulseUntil: number;
  pulseStrength: number;
  cssWidth: number;
  cssHeight: number;
  padX: number;
  padY: number;
  inView: boolean;
}

const ANCHOR_SPECS: AnchorSpec[] = [
  { selector: '.resume-header', rx: 1.12, ry: 1.0, phase: 0 },
  { selector: '.about-hero', rx: 1.1, ry: 0.95, phase: 0.4 },
  { selector: '.section-title', rx: 2.4, ry: 3.0 },
  { selector: '#technologies .tech-categories', rx: 1.08, ry: 1.05, phase: 1.35 },
  { selector: 'app-work-reel', rx: 1.06, ry: 1.1, phase: 2.05 },
  { selector: '.experience-timeline', rx: 1.05, ry: 1.02, phase: 0.75 },
];

/** Studio nebula clouds mounted on page beats — pulse nearest cloud on goal score. */
export class ShaderHero {
  private glCanvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private animationFrame: number | null = null;
  private resizeHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private scrollLayoutPending = false;
  private lastRenderAt = 0;
  private glSize = 0;
  private tabVisible = true;
  private startTime = 0;
  private reducedMotion = false;
  private anchors: CloudAnchor[] = [];
  private color1: [number, number, number] = [0.49, 0.36, 1.0];
  private color2: [number, number, number] = [0.37, 0.92, 0.76];
  private glowColor: [number, number, number] = [0.77, 0.71, 0.99];
  private timeLoc: WebGLUniformLocation | null = null;
  private resolutionLoc: WebGLUniformLocation | null = null;
  private color1Loc: WebGLUniformLocation | null = null;
  private color2Loc: WebGLUniformLocation | null = null;
  private glowLoc: WebGLUniformLocation | null = null;
  private opacityLoc: WebGLUniformLocation | null = null;
  private pulseLoc: WebGLUniformLocation | null = null;
  private phaseLoc: WebGLUniformLocation | null = null;

  init(): void {
    if (this.glCanvas) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.glCanvas = document.createElement('canvas');
    this.glCanvas.width = RENDER_EDGE;
    this.glCanvas.height = RENDER_EDGE;
    this.gl = this.glCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!this.gl) return;

    this.startTime = performance.now();
    this.setupShaders();
    if (!this.program) return;

    this.updateTheme();
    this.glSize = RENDER_EDGE;

    this.resizeHandler = () => this.scheduleLayout();
    window.addEventListener('resize', this.resizeHandler);

    this.visibilityHandler = () => {
      this.tabVisible = !document.hidden;
      if (this.tabVisible) {
        this.startLoop();
      } else {
        this.stopLoop();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.scheduleAnchorRefresh();

    if (this.reducedMotion) {
      this.refreshAnchors();
      this.renderFrame(0, 1);
      return;
    }

    this.startLoop();
  }

  refreshAnchors(): void {
    this.clearAnchors();
    let autoPhase = 0;

    for (const spec of ANCHOR_SPECS) {
      document.querySelectorAll<HTMLElement>(spec.selector).forEach((element) => {
        if (this.anchors.length >= MAX_CLOUDS) return;
        if (element.closest('[data-shader-cloud-skip]')) return;

        const host = this.ensureCloudHost(element);
        const displayCanvas = document.createElement('canvas');
        displayCanvas.className = 'shader-cloud-canvas';
        displayCanvas.setAttribute('aria-hidden', 'true');
        host.prepend(displayCanvas);

        const displayCtx = displayCanvas.getContext('2d', { alpha: true });
        if (!displayCtx) return;

        this.anchors.push({
          element: host,
          displayCanvas,
          displayCtx,
          rx: spec.rx,
          ry: spec.ry,
          phase: spec.phase ?? autoPhase * 0.41,
          pulseUntil: 0,
          pulseStrength: 1,
          cssWidth: 0,
          cssHeight: 0,
          padX: 0,
          padY: 0,
          inView: true,
        });
        autoPhase++;
      });
    }

    this.observeAnchors();
    this.layoutClouds();
  }

  updateTheme(): void {
    this.color1 = readThemeColor('--color-accent', '#7c5cff');
    this.color2 = readThemeColor('--color-accent-secondary', '#5eead4');
    this.glowColor = readThemeColor('--color-accent-muted', '#c4b5fd');
  }

  pulseOnScore(scorePageY: number): void {
    if (this.anchors.length === 0) return;

    const viewY = scorePageY - window.scrollY;
    const viewportH = window.innerHeight;
    const reach = viewportH * 0.34;
    const now = performance.now();

    for (const anchor of this.anchors) {
      const rect = anchor.element.getBoundingClientRect();
      const centerY = rect.top + rect.height * 0.5;
      const dist = Math.abs(centerY - viewY);
      if (dist > reach) continue;

      const strength = 1 - dist / reach;
      anchor.pulseStrength = strength;
      anchor.pulseUntil = now + PULSE_MS;
    }

    this.startLoop();
  }

  destroy(): void {
    this.stopLoop();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.clearAnchors();
    this.glCanvas = null;
    this.program = null;
    this.gl = null;
  }

  private scheduleAnchorRefresh(): void {
    requestAnimationFrame(() => this.refreshAnchors());
    setTimeout(() => this.refreshAnchors(), 200);
  }

  private scheduleLayout(): void {
    if (this.scrollLayoutPending) return;
    this.scrollLayoutPending = true;
    requestAnimationFrame(() => {
      this.scrollLayoutPending = false;
      this.layoutClouds();
    });
  }

  private ensureCloudHost(element: HTMLElement): HTMLElement {
    if (element.classList.contains('shader-cloud-host')) {
      return element;
    }

    const position = getComputedStyle(element).position;
    if (position === 'static') {
      element.classList.add('shader-cloud-host');
      element.style.position = 'relative';
    } else {
      element.classList.add('shader-cloud-host');
    }

    return element;
  }

  private observeAnchors(): void {
    this.intersectionObserver?.disconnect();
    if (typeof IntersectionObserver === 'undefined') return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const anchor = this.anchors.find((a) => a.element === entry.target);
          if (anchor) {
            anchor.inView = entry.isIntersecting;
          }
        }
      },
      { root: null, rootMargin: `${VIEWPORT_MARGIN}px 0px`, threshold: 0 },
    );

    for (const anchor of this.anchors) {
      this.intersectionObserver.observe(anchor.element);
    }
  }

  private clearAnchors(): void {
    for (const anchor of this.anchors) {
      anchor.displayCanvas.remove();
      anchor.element.classList.remove('shader-cloud-host');
    }
    this.anchors = [];
  }

  private setupShaders(): void {
    if (!this.gl) return;

    const vs = this.compileShader(VERTEX_SHADER, this.gl.VERTEX_SHADER);
    const fs = this.compileShader(FRAGMENT_SHADER, this.gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    this.program = this.gl.createProgram()!;
    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('ShaderHero: program link failed', this.gl.getProgramInfoLog(this.program));
      this.program = null;
      return;
    }

    this.gl.useProgram(this.program);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      this.gl.STATIC_DRAW,
    );

    const positionLoc = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(positionLoc);
    this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);

    this.timeLoc = this.gl.getUniformLocation(this.program, 'time');
    this.resolutionLoc = this.gl.getUniformLocation(this.program, 'resolution');
    this.color1Loc = this.gl.getUniformLocation(this.program, 'color1');
    this.color2Loc = this.gl.getUniformLocation(this.program, 'color2');
    this.glowLoc = this.gl.getUniformLocation(this.program, 'glowColor');
    this.opacityLoc = this.gl.getUniformLocation(this.program, 'opacity');
    this.pulseLoc = this.gl.getUniformLocation(this.program, 'pulse');
    this.phaseLoc = this.gl.getUniformLocation(this.program, 'phase');
  }

  private compileShader(source: string, type: number): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('ShaderHero: shader compile failed', this.gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  private layoutClouds(): void {
    for (const anchor of this.anchors) {
      const hostRect = anchor.element.getBoundingClientRect();
      if (hostRect.width <= 0 || hostRect.height <= 0) continue;

      const padX = hostRect.width * (anchor.rx - 1) * 0.5;
      const padY = hostRect.height * (anchor.ry - 1) * 0.5;
      const cssWidth = hostRect.width + padX * 2;
      const cssHeight = hostRect.height + padY * 2;

      anchor.padX = padX;
      anchor.padY = padY;
      anchor.cssWidth = cssWidth;
      anchor.cssHeight = cssHeight;

      anchor.displayCanvas.style.left = `${-padX}px`;
      anchor.displayCanvas.style.top = `${-padY}px`;
      anchor.displayCanvas.style.width = `${cssWidth}px`;
      anchor.displayCanvas.style.height = `${cssHeight}px`;
    }
  }

  private applyColorUniforms(): void {
    if (!this.gl || !this.program) return;
    this.gl.uniform3f(this.color1Loc, this.color1[0], this.color1[1], this.color1[2]);
    this.gl.uniform3f(this.color2Loc, this.color2[0], this.color2[1], this.color2[2]);
    this.gl.uniform3f(this.glowLoc, this.glowColor[0], this.glowColor[1], this.glowColor[2]);
  }

  private anyPulsing(): boolean {
    const now = performance.now();
    return this.anchors.some((anchor) => anchor.pulseUntil > now);
  }

  private computePulse(anchor: CloudAnchor): number {
    if (anchor.pulseUntil <= 0) return 0;
    const remaining = anchor.pulseUntil - performance.now();
    if (remaining <= 0) {
      anchor.pulseUntil = 0;
      return 0;
    }
    const wave = Math.pow(Math.sin((1 - remaining / PULSE_MS) * Math.PI), 0.75);
    return wave * anchor.pulseStrength;
  }

  private ensureGlSize(size: number): void {
    if (!this.gl || !this.glCanvas || this.glSize === size) return;
    this.glCanvas.width = size;
    this.glCanvas.height = size;
    this.gl.viewport(0, 0, size, size);
    this.glSize = size;
  }

  private renderCloudToDisplay(anchor: CloudAnchor, time: number, fadeOpacity: number): void {
    if (!this.gl || !this.program || !this.glCanvas) return;
    if (!anchor.inView || anchor.cssWidth <= 0 || anchor.cssHeight <= 0) return;

    const pulse = this.computePulse(anchor);
    const size = RENDER_EDGE;
    this.ensureGlSize(size);

    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.applyColorUniforms();
    this.gl.uniform1f(this.timeLoc, time);
    this.gl.uniform2f(this.resolutionLoc, size, size);
    this.gl.uniform1f(this.opacityLoc, fadeOpacity);
    this.gl.uniform1f(this.pulseLoc, pulse);
    this.gl.uniform1f(this.phaseLoc, anchor.phase);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    const w = Math.max(1, Math.round(anchor.cssWidth));
    const h = Math.max(1, Math.round(anchor.cssHeight));
    if (anchor.displayCanvas.width !== w || anchor.displayCanvas.height !== h) {
      anchor.displayCanvas.width = w;
      anchor.displayCanvas.height = h;
    }

    const ctx = anchor.displayCtx;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(this.glCanvas, 0, 0, size, size, 0, 0, w, h);
  }

  private renderFrame(time: number, fadeOpacity: number): void {
    for (const anchor of this.anchors) {
      if (!anchor.inView && anchor.pulseUntil <= performance.now()) continue;
      this.renderCloudToDisplay(anchor, time, fadeOpacity);
    }
  }

  private startLoop(): void {
    if (this.animationFrame !== null || this.reducedMotion) return;
    this.lastRenderAt = 0;
    this.animationFrame = requestAnimationFrame(this.render);
  }

  private stopLoop(): void {
    if (this.animationFrame === null) return;
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
  }

  private render = (now: number): void => {
    this.animationFrame = requestAnimationFrame(this.render);

    if (!this.tabVisible || this.anchors.length === 0) return;

    const frameBudget = this.anyPulsing() ? PULSE_FRAME_MS : AMBIENT_FRAME_MS;
    if (now - this.lastRenderAt < frameBudget) return;
    this.lastRenderAt = now;

    const elapsed = (now - this.startTime) * 0.001;
    const fadeOpacity = Math.min(1, elapsed / FADE_SECONDS);
    this.renderFrame(elapsed, fadeOpacity);
  };
}
