import { GlbEntry } from './glb-loader.service';

export interface VehicleModelDef {
  /** Target bounding-box used to normalise imported model scale. */
  width: number;
  depth: number;
  height: number;
  /** Y-axis rotation offset (radians) if model doesn't face +Z. */
  rotationOffset: number;
}

/** All sedan variant GLB files — preloaded at startup. */
export const VEHICLE_GLB_ENTRIES: GlbEntry[] = [
  { key: 'sedan_black',                    path: 'models/vehicles/sedan_black.glb' },
  { key: 'sedan_black_with_white_stripe',  path: 'models/vehicles/sedan_black_with_white_stripe.glb' },
  { key: 'sedan_blue',                     path: 'models/vehicles/sedan_blue.glb' },
  { key: 'sedan_green',                    path: 'models/vehicles/sedan_green.glb' },
  { key: 'sedan_grey_with_white_stripe',   path: 'models/vehicles/sedan_grey_with_white_stripe.glb' },
  { key: 'sedan_orange',                   path: 'models/vehicles/sedan_orange.glb' },
  { key: 'sedan_orange_with_black_stripe', path: 'models/vehicles/sedan_orange_with_black_stripe.glb' },
  { key: 'sedan_red',                      path: 'models/vehicles/sedan_red.glb' },
  { key: 'sedan_red_with_black_stripe',    path: 'models/vehicles/sedan_red_with_black_stripe.glb' },
  { key: 'sedan_red_with_white_stripe',    path: 'models/vehicles/sedan_red_with_white_stripe.glb' },
  { key: 'sedan_white',                    path: 'models/vehicles/sedan_white.glb' },
  { key: 'sedan_white_with_black_stripe',  path: 'models/vehicles/sedan_white_with_black_stripe.glb' },
];

/** Keys used by the vehicle builder for random selection. */
export const VEHICLE_VARIANT_KEYS: string[] = VEHICLE_GLB_ENTRIES.map(e => e.key);

/** Target dimensions & orientation corrections for sedan models. */
export const VEHICLE_MODEL_DEF: VehicleModelDef = {
  width: 2.5, depth: 5, height: 1.8, rotationOffset: 0,
};
