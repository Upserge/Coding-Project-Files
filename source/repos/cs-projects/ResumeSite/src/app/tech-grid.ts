export interface TechCategoryDisplay {
  label: string;
  items: string[];
  columns: number;
  rows: number;
  slots: Array<string | null>;
}

/** Pick column count so sibling category grids share the same row count. */
export function computeSymmetricGrid(counts: number[]): { columns: number; rows: number } {
  if (counts.length === 0) {
    return { columns: 2, rows: 0 };
  }

  if (counts.length === 1) {
    const count = counts[0];
    const columns = count <= 2 ? count : count <= 4 ? 2 : count <= 6 ? 3 : 4;
    return { columns, rows: Math.ceil(count / columns) };
  }

  let best = { columns: 3, rows: 1 };
  let bestScore = Infinity;
  const minCount = Math.min(...counts);

  for (let cols = 2; cols <= 6; cols++) {
    const rowCounts = counts.map((n) => Math.ceil(n / cols));
    const rows = Math.max(...rowCounts);
    const imbalance = Math.max(...rowCounts) - Math.min(...rowCounts);
    const emptyCells = counts.reduce((sum, n) => sum + rows * cols - n, 0);
    const widePenalty = Math.max(0, cols - minCount) * 12;
    const score = imbalance * 1000 + emptyCells * 4 + rows * 3 + widePenalty;

    if (score < bestScore) {
      bestScore = score;
      best = { columns: cols, rows };
    }
  }

  return best;
}

export function padCategorySlots(items: string[], columns: number, rows: number): Array<string | null> {
  const slots: Array<string | null> = [...items];
  const target = columns * rows;
  while (slots.length < target) {
    slots.push(null);
  }
  return slots;
}

export function buildSymmetricCategories(
  categories: Array<{ label: string; items: string[] }>,
): TechCategoryDisplay[] {
  const active = categories.filter((category) => category.items.length > 0);
  if (active.length === 0) {
    return [];
  }

  const counts = active.map((category) => category.items.length);
  const { columns, rows } = computeSymmetricGrid(counts);

  return active.map((category) => ({
    label: category.label,
    items: category.items,
    columns,
    rows,
    slots: padCategorySlots(category.items, columns, rows),
  }));
}
