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
  /** Recent rear positions for the luminous contrail ribbon (newest first). */
  wake?: { x: number; y: number }[];
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

/** Celebration spark: implodes -> charges at the core -> bursts violently outward. */
export interface ConfettiPiece {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  cx: number;
  cy: number;
  r: number;
  color: string;
  life: number;
  decay: number;
  phase: 'implode' | 'charge' | 'burst';
  age: number;
  spin: number;
  kind: 'spark' | 'core';
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
