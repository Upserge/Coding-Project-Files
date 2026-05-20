/** Client-side body normalization (must match functions/src/duplicates.ts). */
export function normalizeBody(body: string): string {
  return body
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function bodyHash(body: string): string {
  return normalizeBody(body);
}
