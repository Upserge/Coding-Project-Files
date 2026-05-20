/** Client-side profanity check (keep in sync with functions/src/moderation.ts). */
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
