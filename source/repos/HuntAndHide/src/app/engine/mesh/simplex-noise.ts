const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const GRADIENTS: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const PERM = buildPermutation(1337);

export function sampleSimplex2D(x: number, y: number): number {
  const cell = getCellOrigin(x, y);
  const offset = getCornerOffset(x, y, cell.i, cell.j);
  const step = offset.x0 > offset.y0 ? 1 : 0;
  const n0 = sampleCorner(cell.i, cell.j, offset.x0, offset.y0);
  const n1 = sampleCorner(cell.i + step, cell.j + 1 - step, offset.x0 - step + G2, offset.y0 - (1 - step) + G2);
  const n2 = sampleCorner(cell.i + 1, cell.j + 1, offset.x0 - 1 + 2 * G2, offset.y0 - 1 + 2 * G2);
  return 70 * (n0 + n1 + n2);
}

function buildPermutation(seed: number): Uint8Array {
  const values = Array.from({ length: 256 }, (_, index) => index);
  let state = seed >>> 0;
  for (let index = values.length - 1; index > 0; index--) {
    state = nextSeed(state);
    swap(values, index, state % (index + 1));
  }
  return expandPermutation(values);
}

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function swap(values: number[], left: number, right: number): void {
  const current = values[left];
  values[left] = values[right];
  values[right] = current;
}

function expandPermutation(values: number[]): Uint8Array {
  const perm = new Uint8Array(512);
  for (let index = 0; index < perm.length; index++) perm[index] = values[index & 255];
  return perm;
}

function getCellOrigin(x: number, y: number): { i: number; j: number } {
  const skew = (x + y) * F2;
  return { i: Math.floor(x + skew), j: Math.floor(y + skew) };
}

function getCornerOffset(x: number, y: number, i: number, j: number): { x0: number; y0: number } {
  const unskew = (i + j) * G2;
  return { x0: x - (i - unskew), y0: y - (j - unskew) };
}

function sampleCorner(i: number, j: number, x: number, y: number): number {
  const falloff = 0.5 - x * x - y * y;
  if (falloff <= 0) return 0;
  const gradient = getGradient(i, j);
  const weight = falloff * falloff;
  return weight * weight * (gradient[0] * x + gradient[1] * y);
}

function getGradient(i: number, j: number): readonly [number, number] {
  return GRADIENTS[PERM[(i & 255) + PERM[j & 255]] % GRADIENTS.length];
}
