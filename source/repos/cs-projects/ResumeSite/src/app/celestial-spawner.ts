// Galaxy, Taurus constellation spawning and constellation line rendering
import { Particle, TaurusLine } from './particle-field-types';

export function spawnGalaxies(w: number, h: number, driftSpeed: number, galaxyCount: number): Particle[] {
  const particles: Particle[] = [];

  // Galaxy color palettes — warm whites, soft blues, pale golds
  const palettes: { r: number; g: number; b: number }[][] = [
    // Warm white / gold nebula
    [
      { r: 255, g: 245, b: 220 },
      { r: 255, g: 225, b: 180 },
      { r: 255, g: 210, b: 160 },
      { r: 240, g: 200, b: 170 },
    ],
    // Cool blue / cyan nebula
    [
      { r: 180, g: 210, b: 255 },
      { r: 160, g: 200, b: 255 },
      { r: 140, g: 180, b: 240 },
      { r: 200, g: 220, b: 255 },
    ],
    // Rose / magenta nebula
    [
      { r: 255, g: 190, b: 220 },
      { r: 240, g: 170, b: 210 },
      { r: 220, g: 160, b: 200 },
      { r: 255, g: 200, b: 230 },
    ],
    // Emerald / teal nebula
    [
      { r: 160, g: 240, b: 220 },
      { r: 140, g: 220, b: 200 },
      { r: 180, g: 255, b: 230 },
      { r: 170, g: 230, b: 210 },
    ],
  ];

  const types: ('spiral' | 'elliptical' | 'band')[] = ['spiral', 'elliptical', 'band', 'spiral'];

  for (let gi = 0; gi < galaxyCount; gi++) {
    const type = types[gi % types.length];
    const palette = palettes[gi % palettes.length];
    const cx = w * 0.15 + Math.random() * w * 0.7;
    const cy = h * 0.1 + Math.random() * h * 0.8;
    const rotation = Math.random() * Math.PI * 2;
    const size = 120 + Math.random() * 180;
    const armCount = type === 'spiral' ? 2 + Math.floor(Math.random() * 5) : 0;
    const starCount = type === 'band' ? 100 + Math.floor(Math.random() * 60) : 60 + Math.floor(Math.random() * 50);

    for (let si = 0; si < starCount; si++) {
      let sx: number, sy: number;

      if (type === 'spiral') {
        // Logarithmic spiral arms with scatter
        const arm = si % armCount;
        const armAngle = (arm / armCount) * Math.PI * 2;
        const t = (si / starCount) * 4; // distance along spiral
        const spiralAngle = armAngle + t * 1.8 + rotation;
        const spiralR = t * size * 0.35;
        const scatter = (Math.random() - 0.5) * size * 0.18 * (0.5 + t * 0.3);
        const scatterPerp = (Math.random() - 0.5) * size * 0.12;
        sx = cx + Math.cos(spiralAngle) * (spiralR + scatter) + Math.cos(spiralAngle + Math.PI / 2) * scatterPerp;
        sy = cy + Math.sin(spiralAngle) * (spiralR + scatter) * 0.55 + Math.sin(spiralAngle + Math.PI / 2) * scatterPerp * 0.55;
      } else if (type === 'elliptical') {
        // Dense oval cluster with Gaussian-like falloff
        const angle = Math.random() * Math.PI * 2;
        const rr = Math.pow(Math.random(), 0.6) * size * 0.5;
        sx = cx + Math.cos(angle + rotation) * rr;
        sy = cy + Math.sin(angle + rotation) * rr * 0.6;
      } else {
        // Milky way band — long thin stripe with density variation
        const along = (Math.random() - 0.5) * size * 2.5;
        const perp = (Math.random() - 0.5) * size * 0.25;
        // Denser in the center
        const densityBias = Math.pow(Math.random(), 0.7);
        const adjustedPerp = perp * densityBias;
        sx = cx + Math.cos(rotation) * along - Math.sin(rotation) * adjustedPerp;
        sy = cy + Math.sin(rotation) * along + Math.cos(rotation) * adjustedPerp;
      }

      const color = palette[Math.floor(Math.random() * palette.length)];
      // Galaxy stars are slightly brighter and smaller than normal particles
      const distFromCenter = Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2);
      const centerFade = Math.max(0.15, 1 - distFromCenter / (size * 1.5));
      const angle = Math.random() * Math.PI * 2;
      const galDriftSpeed = driftSpeed * 0.15; // very slow drift to hold formation

      particles.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * galDriftSpeed,
        vy: Math.sin(angle) * galDriftSpeed,
        r: 0.4 + Math.random() * 1.6,
        opacity: (0.15 + Math.random() * 0.35) * centerFade,
        driftAngle: angle,
        driftRate: (Math.random() - 0.5) * 0.002,
        golden: false,
        pushTime: 0,
        galaxyColor: color,
        anchorX: sx,
        anchorY: sy,
      });
    }
  }

  return particles;
}

// Taurus constellation — ode to Sarah ♉ (Symbol shape)
export function spawnTaurus(
  w: number, h: number, driftSpeed: number
): { particles: Particle[]; lines: TaurusLine[] } {
  const particles: Particle[] = [];

  // Generic Taurus symbol coordinates (circle face + horn crescent)
  const stars: { x: number; y: number; mag: number }[] = [
    // Circle Face (8 stars)
    { x: 0.50, y: 0.77, mag: 0.5 }, // Bottom
    { x: 0.58, y: 0.73, mag: 0.45 }, // Bottom Right
    { x: 0.62, y: 0.65, mag: 0.5 }, // Right
    { x: 0.58, y: 0.57, mag: 0.45 }, // Top Right
    { x: 0.50, y: 0.53, mag: 0.5 }, // Top
    { x: 0.42, y: 0.57, mag: 0.45 }, // Top Left
    { x: 0.38, y: 0.65, mag: 0.5 }, // Left
    { x: 0.42, y: 0.73, mag: 0.45 }, // Bottom Left

    // Left Horn (5 stars)
    { x: 0.35, y: 0.50, mag: 0.6 },
    { x: 0.30, y: 0.42, mag: 0.55 },
    { x: 0.27, y: 0.33, mag: 0.5 },
    { x: 0.25, y: 0.24, mag: 0.6 },
    { x: 0.24, y: 0.15, mag: 0.7 }, // Tip

    // Right Horn (5 stars)
    { x: 0.65, y: 0.50, mag: 0.6 },
    { x: 0.70, y: 0.42, mag: 0.55 },
    { x: 0.73, y: 0.33, mag: 0.5 },
    { x: 0.75, y: 0.24, mag: 0.6 },
    { x: 0.76, y: 0.15, mag: 0.7 }, // Tip
  ];

  // Constellation line connections
  const lineIndices: [number, number][] = [
    // Circle loop
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
    // Left Horn
    [5, 8], [8, 9], [9, 10], [10, 11], [11, 12],
    // Right Horn
    [3, 13], [13, 14], [14, 15], [15, 16], [16, 17],
  ];

  // Place at a random position on the page
  const scale = 100 + Math.random() * 100; // constellation size in px
  const rotation = (Math.random() - 0.5) * 0.6; // slight random tilt
  const cx = w * 0.2 + Math.random() * w * 0.6;
  const cy = h * 0.15 + Math.random() * h * 0.7;

  // Light red color palette for Taurus
  const taurusColors: { r: number; g: number; b: number }[] = [
    { r: 255, g: 160, b: 140 },
    { r: 255, g: 140, b: 120 },
    { r: 240, g: 150, b: 130 },
    { r: 255, g: 170, b: 150 },
  ];

  // Compute world positions for each star
  const worldStars: { wx: number; wy: number }[] = [];
  for (const star of stars) {
    // Center the normalized coords around 0, apply scale + rotation
    const lx = (star.x - 0.45) * scale;
    const ly = (star.y - 0.40) * scale;
    const rx = lx * Math.cos(rotation) - ly * Math.sin(rotation);
    const ry = lx * Math.sin(rotation) + ly * Math.cos(rotation);
    worldStars.push({ wx: cx + rx, wy: cy + ry });
  }

  // Build line data for drawing in render loop
  const lines: TaurusLine[] = lineIndices.map(([a, b]) => ({
    x1: worldStars[a].wx, y1: worldStars[a].wy,
    x2: worldStars[b].wx, y2: worldStars[b].wy,
  }));

  // Spawn star particles
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const { wx, wy } = worldStars[i];
    const color = taurusColors[Math.floor(Math.random() * taurusColors.length)];
    const driftAngle = 0;
    const tauDriftSpeed = driftSpeed * 0.08; // barely move

    particles.push({
      x: wx,
      y: wy,
      vx: Math.cos(driftAngle) * tauDriftSpeed,
      vy: Math.sin(driftAngle) * tauDriftSpeed,
      r: 0.8 + star.mag * 2.2, // brighter stars = larger
      opacity: 0.3 + star.mag * 0.5,
      driftAngle,
      driftRate: (Math.random() - 0.5) * 0.001,
      golden: false,
      pushTime: 0,
      galaxyColor: color,
      anchorX: wx,
      anchorY: wy,
    });
  }

  return { particles, lines };
}

export function drawTaurusLines(
  ctx: CanvasRenderingContext2D,
  lines: TaurusLine[],
  viewTop: number, viewBottom: number,
  isDark: boolean
): void {
  if (lines.length === 0) return;

  for (const line of lines) {
    // Skip if both endpoints are off-screen
    if (line.y1 < viewTop && line.y2 < viewTop) continue;
    if (line.y1 > viewBottom && line.y2 > viewBottom) continue;

    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.strokeStyle = isDark
      ? 'rgba(255, 150, 130, 0.12)'
      : 'rgba(200, 100, 80, 0.18)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
}
