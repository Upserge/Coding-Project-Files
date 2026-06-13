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
    return [0.43, 0.36, 1.0];
  }
  const value = parseInt(expanded, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export class ShaderHero {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private animationFrame: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private visibilityHandler: (() => void) | null = null;
  private tabVisible = true;
  private startTime = 0;
  private reducedMotion = false;
  private color1: [number, number, number] = [0.43, 0.36, 1.0];
  private color2: [number, number, number] = [0.37, 0.92, 0.76];
  private timeLoc: WebGLUniformLocation | null = null;
  private resolutionLoc: WebGLUniformLocation | null = null;
  private color1Loc: WebGLUniformLocation | null = null;
  private color2Loc: WebGLUniformLocation | null = null;
  private opacityLoc: WebGLUniformLocation | null = null;

  private readonly vertexShader = `
    precision mediump float;
    attribute vec2 position;
    varying vec2 vUv;

    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
      vUv = position * 0.5 + 0.5;
    }
  `;

  private readonly fragmentShader = `
    precision mediump float;
    uniform float time;
    uniform vec2 resolution;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float opacity;
    varying vec2 vUv;

    float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      float t = time * 0.3;

      float n1 = noise(vec3(uv * 3.0, t));
      float n2 = noise(vec3(uv * 5.0, t * 0.7));
      float n3 = noise(vec3(uv * 7.0, t * 0.5));

      float pattern = mix(n1, mix(n2, n3, 0.5), 0.5);
      vec3 finalColor = mix(color1, color2, pattern);
      float alpha = (0.08 + 0.24 * pattern) * opacity;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  init() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.canvas = document.getElementById('hero-canvas') as HTMLCanvasElement;
    if (!this.canvas) return;

    this.gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!this.gl) return;

    this.startTime = performance.now();
    this.setupShaders();
    if (!this.program) return;

    this.updateTheme();
    this.resizeCanvas();

    const resizeTarget = this.canvas.parentElement ?? this.canvas;
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
      this.resizeObserver.observe(resizeTarget);
    }

    this.visibilityHandler = () => {
      this.tabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    if (this.reducedMotion) {
      this.renderFrame(0, 1);
      return;
    }

    this.render();
  }

  updateTheme() {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    this.color1 = parseHexColor(accent || '#6f5cff');
    this.color2 = [0.37, 0.92, 0.76];
    if (this.gl && this.program) {
      this.applyColorUniforms();
    }
  }

  private setupShaders() {
    if (!this.gl) return;

    const vs = this.compileShader(this.vertexShader, this.gl.VERTEX_SHADER);
    const fs = this.compileShader(this.fragmentShader, this.gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    this.program = this.gl.createProgram()!;
    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Shader program failed to link');
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
      this.gl.STATIC_DRAW
    );

    const positionLoc = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(positionLoc);
    this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);

    this.timeLoc = this.gl.getUniformLocation(this.program, 'time');
    this.resolutionLoc = this.gl.getUniformLocation(this.program, 'resolution');
    this.color1Loc = this.gl.getUniformLocation(this.program, 'color1');
    this.color2Loc = this.gl.getUniformLocation(this.program, 'color2');
    this.opacityLoc = this.gl.getUniformLocation(this.program, 'opacity');
  }

  private compileShader(source: string, type: number) {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  private resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const width = parent?.clientWidth ?? window.innerWidth;
    const height = parent?.clientHeight ?? window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private applyColorUniforms() {
    if (!this.gl || !this.program) return;
    this.gl.uniform3f(this.color1Loc, this.color1[0], this.color1[1], this.color1[2]);
    this.gl.uniform3f(this.color2Loc, this.color2[0], this.color2[1], this.color2[2]);
  }

  private renderFrame(time: number, fadeOpacity: number) {
    if (!this.gl || !this.program || !this.canvas) return;

    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.applyColorUniforms();
    this.gl.uniform1f(this.timeLoc, time);
    this.gl.uniform2f(this.resolutionLoc, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.opacityLoc, fadeOpacity);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  private render = () => {
    if (!this.tabVisible) {
      this.animationFrame = requestAnimationFrame(this.render);
      return;
    }

    const elapsed = (performance.now() - this.startTime) * 0.001;
    const fadeOpacity = Math.min(1, elapsed / 1.2);
    this.renderFrame(elapsed, fadeOpacity);
    this.animationFrame = requestAnimationFrame(this.render);
  };

  destroy() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.program = null;
    this.gl = null;
    this.canvas = null;
  }
}
