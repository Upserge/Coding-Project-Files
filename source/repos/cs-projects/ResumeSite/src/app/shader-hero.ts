// Enhanced hero with WebGL shader support
export class ShaderHero {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private animationFrame: number | null = null;

  private vertexShader = `
    precision mediump float;
    attribute vec2 position;
    varying vec2 vUv;

    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
      vUv = position * 0.5 + 0.5;
    }
  `;

  private fragmentShader = `
    precision mediump float;
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      float t = time * 0.3;
      
      // Multiple layers of noise/waves
      float n1 = noise(vec3(uv * 3.0, t));
      float n2 = noise(vec3(uv * 5.0, t * 0.7));
      float n3 = noise(vec3(uv * 7.0, t * 0.5));
      
      float pattern = mix(n1, mix(n2, n3, 0.5), 0.5);
      
      // Color with accent colors
      vec3 color1 = vec3(0.43, 0.36, 1.0); // #6f5cff
      vec3 color2 = vec3(0.37, 0.92, 0.76); // #5eead4
      
      vec3 finalColor = mix(color1, color2, pattern);
      float alpha = 0.08 * pattern;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  init() {
    this.canvas = document.getElementById('hero-canvas') as HTMLCanvasElement;
    if (!this.canvas) return;

    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) return;

    this.setupShaders();
    this.render();
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
      return;
    }

    this.gl.useProgram(this.program);

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

  private render = () => {
    if (!this.gl || !this.program) return;

    const startTime = Date.now();
    const time = (Date.now() - startTime) * 0.001;

    this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'time'), time);
    this.gl.uniform2f(
      this.gl.getUniformLocation(this.program, 'resolution'),
      this.canvas!.width,
      this.canvas!.height
    );

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    this.animationFrame = requestAnimationFrame(this.render);
  };

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
