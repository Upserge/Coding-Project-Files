/**
 * Lightweight profanity check (CommonJS-safe; no ESM-only dependencies).
 * Expand this list or swap for a moderation API in production.
 */
const BLOCKED_TERMS = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'nigger',
  'faggot',
  'retard',
];

export function containsProfanity(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^a-z\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);
  return words.some((word) => BLOCKED_TERMS.includes(word));
}
