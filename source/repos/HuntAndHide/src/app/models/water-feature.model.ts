import { WaterPlacement } from './map.model';
import { Vec3 } from './player.model';

export const WATER_SURFACE_OFFSET = 0.008;
export const WATER_SHORE_OFFSET = 0.002;
export const WATER_CAUSTIC_OFFSET = 0.014;
export const STREAM_SURFACE_WIDTH = 1.8;
export const STREAM_BED_WIDTH = 2.2;

const STREAM_CAUSTIC_INSET = 0.16;

export interface WaterSurfaceSize {
  width: number;
  length: number;
}

export function getWaterSurfaceSize(water: WaterPlacement): WaterSurfaceSize {
  if (water.type === 'pond') return { width: water.size * 2, length: water.size * 2 };
  return { width: STREAM_SURFACE_WIDTH, length: water.size };
}

export function getCausticSurfaceSize(water: WaterPlacement): WaterSurfaceSize {
  if (water.type === 'pond') return { width: water.size * 1.75, length: water.size * 1.75 };
  return {
    width: Math.max(0.6, STREAM_SURFACE_WIDTH - STREAM_CAUSTIC_INSET),
    length: Math.max(0.8, water.size - STREAM_CAUSTIC_INSET),
  };
}

export function isPositionInWater(position: Vec3, waters: WaterPlacement[]): boolean {
  return waters.some(water => containsWaterPosition(position, water));
}

function containsWaterPosition(position: Vec3, water: WaterPlacement): boolean {
  if (water.type === 'pond') return isInsidePond(position, water);
  return isInsideStream(position, water);
}

function isInsidePond(position: Vec3, water: WaterPlacement): boolean {
  const dx = position.x - water.position.x;
  const dz = position.z - water.position.z;
  return dx * dx + dz * dz <= water.size * water.size;
}

function isInsideStream(position: Vec3, water: WaterPlacement): boolean {
  const dx = position.x - water.position.x;
  const dz = position.z - water.position.z;
  const cos = Math.cos(-water.rotationY);
  const sin = Math.sin(-water.rotationY);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;
  return Math.abs(localX) <= STREAM_SURFACE_WIDTH / 2 && Math.abs(localZ) <= water.size / 2;
}
