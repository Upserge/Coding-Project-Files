import { WaterPlacement } from './map.model';
import { Vec3 } from './player.model';

export function isPositionInWater(position: Vec3, waters: WaterPlacement[]): boolean {
  return waters.some(water => isInsidePond(position, water));
}

function isInsidePond(position: Vec3, water: WaterPlacement): boolean {
  const dx = position.x - water.position.x;
  const dz = position.z - water.position.z;
  return dx * dx + dz * dz <= water.size * water.size;
}
