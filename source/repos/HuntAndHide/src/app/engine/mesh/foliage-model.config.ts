import { GlbEntry } from './glb-loader.service';

/** Target bounding-box for normalising imported foliage scale. */
export interface FoliageModelDef {
  width: number;
  depth: number;
  height: number;
}

// ── Tree variants ────────────────────────────────────────────

export const TREE_GLB_ENTRIES: GlbEntry[] = [
  { key: 'tree_large',      path: 'models/foliage/tree_large.glb' },
  { key: 'tree_medium',     path: 'models/foliage/tree_medium.glb' },
  { key: 'tree_medium_axe', path: 'models/foliage/tree_medium_axe.glb' },
  { key: 'tree_thin',       path: 'models/foliage/tree_thin.glb' },
];

export const TREE_VARIANT_KEYS: string[] = TREE_GLB_ENTRIES.map(e => e.key);

export const TREE_MODEL_DEF: FoliageModelDef = {
  width: 3, depth: 3, height: 6,
};

// ── Bush variants ────────────────────────────────────────────

export const BUSH_GLB_ENTRIES: GlbEntry[] = [
  { key: 'bush_large_clump',   path: 'models/foliage/bush_large_clump.glb' },
  { key: 'bush_large_clump_2', path: 'models/foliage/bush_large_clump_2.glb' },
  { key: 'bush_medium_clump',  path: 'models/foliage/bush_medium_clump.glb' },
  { key: 'bush_small_clump',   path: 'models/foliage/bush_small_clump.glb' },
  { key: 'bush_small_clump_2', path: 'models/foliage/bush_small_clump_2.glb' },
];

export const BUSH_VARIANT_KEYS: string[] = BUSH_GLB_ENTRIES.map(e => e.key);

export const BUSH_MODEL_DEF: FoliageModelDef = {
  width: 2.5, depth: 2.5, height: 2,
};

// ── Tent ─────────────────────────────────────────────────────

export const TENT_GLB_ENTRIES: GlbEntry[] = [
  { key: 'tent', path: 'models/foliage/tent.glb' },
];

export const TENT_MODEL_DEF: FoliageModelDef = {
  width: 5, depth: 5, height: 4.5,
};

// ── Picnic scene ─────────────────────────────────────────────

export const PICNIC_GLB_ENTRIES: GlbEntry[] = [
  { key: 'picnic_scene', path: 'models/foliage/picnic_scene.glb' },
];

export const PICNIC_MODEL_DEF: FoliageModelDef = {
  width: 4, depth: 4, height: 2,
};

// ── Leaf pile ────────────────────────────────────────────────

export const LEAF_PILE_GLB_ENTRIES: GlbEntry[] = [
  { key: 'leaf_pile', path: 'models/foliage/leaf_pile.glb' },
];

export const LEAF_PILE_MODEL_DEF: FoliageModelDef = {
  width: 3.5,
  depth: 3.5,
  height: 2,
};

/** All foliage GLB entries combined for bulk preloading. */
export const ALL_FOLIAGE_GLB_ENTRIES: GlbEntry[] = [
  ...TREE_GLB_ENTRIES,
  ...BUSH_GLB_ENTRIES,
  ...TENT_GLB_ENTRIES,
  ...PICNIC_GLB_ENTRIES,
  ...LEAF_PILE_GLB_ENTRIES,
];
