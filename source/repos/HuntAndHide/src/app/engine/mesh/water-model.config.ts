import { GlbEntry } from './glb-loader.service';

/** Target bounding-box for normalising imported water-feature scale. */
export interface WaterModelDef {
  width: number;
  depth: number;
  height: number;
}

// ── Pond ─────────────────────────────────────────────────────

export const POND_GLB_ENTRIES: GlbEntry[] = [
  { key: 'pond', path: 'models/water_features/pond.glb' },
];

export const POND_MODEL_DEF: WaterModelDef = {
  width: 6, depth: 6, height: 1.5,
};

/** All water-feature GLB entries combined for bulk preloading. */
export const ALL_WATER_GLB_ENTRIES: GlbEntry[] = [
  ...POND_GLB_ENTRIES,
];
