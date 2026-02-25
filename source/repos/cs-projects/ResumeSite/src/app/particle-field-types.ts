export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  driftAngle: number;
  driftRate: number;
  golden: boolean;
  pushTime: number;
  galaxyColor?: { r: number; g: number; b: number };
  anchorX?: number;
  anchorY?: number;
}

export interface GoalPost {
  x: number;
  y: number;
  pulsePhase: number;
  scored: boolean;
  scoreTimer: number;
  radius: number;
  diskTilt: number;
  diskAxis: number;
  spinSpeed: number;
}

export interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  life: number;
  decay: number;
  shape: 'rect' | 'circle';
}

export interface TrailPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  hot: boolean;
}

export interface SpaghettiStream {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  width: number;
  length: number;
  color: string;
  goalX: number;
  goalY: number;
}

export interface TaurusLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
