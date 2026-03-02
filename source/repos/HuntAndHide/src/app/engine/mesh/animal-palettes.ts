import { AnimalCharacter } from '../../models/player.model';

/** Soft pastel body colours per animal. */
export const ANIMAL_COLORS: Record<AnimalCharacter, number> = {
  // Hiders — soft, warm pastels
  fox:       0xd4845a,
  rabbit:    0xe8d5c0,
  deer:      0xb08850,
  frog:      0x7ec87e,
  owl:       0x9c7e60,
  snake:     0x8aad6a,
  chameleon: 0x6cc4b4,
  pig:       0xf5a0a0,
  // Hunters — deeper, bolder
  wolf:    0x7a7a8a,
  lion:    0xdaaa40,
  panther: 0x2a2a3e,
};

/** Lighter belly / accent colour per animal. */
export const BELLY_COLORS: Record<AnimalCharacter, number> = {
  fox: 0xf5e6d0, rabbit: 0xffffff, deer: 0xe0cca8, frog: 0xc8e8a0,
  owl: 0xd4c4a8, snake: 0xc8dca0, chameleon: 0xa0e8d8, pig: 0xffe0e0,
  wolf: 0xb8b8c4, lion: 0xf0dca0, panther: 0x484860,
};

export const HUNTER_BODY_COLOR = 0xcc3333;
export const HIDER_BODY_COLOR  = 0x33aa55;
