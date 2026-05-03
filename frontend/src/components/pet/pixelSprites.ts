// 16x16 Pixel Sprite definitions for HydratePet
// Each character maps to a color via the palette
// '.' = transparent, 'B' = outline (black), 'W' = white highlight
// 'P' = primary body, 'S' = secondary body (shading), 'A' = accent
// 'E' = eye (black), 'H' = cheek/highlight area

// Each sprite is an array of 16 strings (each string = 1 row of 16 pixels)
export type PixelGrid = string[];  // array of row strings, each 16 chars
export type PixelSpriteData = Record<string, PixelGrid>;

// Each sprite is a 16x16 grid stored as an array of 16 strings (each 16 chars)
// Left-right symmetrical, Pokemon-like pixel art style

export const SPRITES: PixelSpriteData = {
  // ============================================================
  // EGG - Spotted oval shape, like a Pokémon egg
  // ============================================================
  egg: [
    '................', // row 0
    '................', // row 1
    '....PPPPPPPP....', // row 2
    '...PPPPPPPPPP...', // row 3
    '..PPPSPPSSPPSP..', // row 4 - spots begin
    '..PPSPPSPPSPSP..', // row 5
    '..PPSPSPPSSPPP..', // row 6
    '..PPSSPPSPPSPP..', // row 7
    '..PPSPPSPSPPPS..', // row 8 - spots end
    '..PPPPPPPPPPPP..', // row 9
    '...PPPPPPPPPP...', // row 10
    '....PPPPPPPP....', // row 11
    '................', // row 12
    '................', // row 13
    '................', // row 14
    '................', // row 15
  ],

  // ============================================================
  // BABY - Small round creature, Pichu-like
  // Big head, tiny body, cute eyes
  // ============================================================
  baby: [
    '................', // row 0
    '................', // row 1
    '.....BBBBB......', // row 2 - head top
    '....BPPPPPB.....', // row 3 - head outline
    '...BPPPPPPPB....', // row 4 - head
    '...BEPPPPEPPB...', // row 5 - eyes (E at x=4, x=10)
    '...BPWPPPWPPB...', // row 6 - eye shine (W)
    '...BPPPPPPPPB...', // row 7 - head bottom
    '..BBPPPPPPPPB...', // row 8 - neck
    '..BPPPPPPPPPB...', // row 9 - body
    '..BPPSPSPSPPB...', // row 10 - body shading
    '..BPPPPPPPPPB...', // row 11 - body bottom
    '..BBPPPPPPBB....', // row 12 - hips
    '...BBBBBBBB.....', // row 13 - bottom
    '.....BB.BB......', // row 14 - tiny feet
    '................', // row 15
  ],

  // ============================================================
  // CHILD - Larger body, short limbs, Eevee-like
  // Four legs, round ears, fluffy tail hint
  // ============================================================
  child: [
    '................', // row 0
    '..BB.......BB...', // row 1 - ears
    '..BPPB...BPPB...', // row 2 - ears inner
    '...BBPPPPBB.....', // row 3 - head top
    '..BBPPPPPPBB....', // row 4 - head outline
    '..BPPPPPPPPB....', // row 5 - head
    '..BEPPPPEPPB....', // row 6 - eyes
    '..BPWPPPWPPB....', // row 7 - eye shine
    '..BPPPPPPPPBB...', // row 8 - head bottom
    '.BBPPPPPPPPPB...', // row 9 - body
    '.BPPPPSSSPPB....', // row 10 - body shading
    '.BPPSSSSSPPB....', // row 11 - body bottom
    '.BBPPPPPPBB.....', // row 12 - hips
    '..BBBBBBBB......', // row 13
    '.BB..BB..BB.....', // row 14 - four short legs
    '................', // row 15
  ],

  // ============================================================
  // TEEN - Taller, visible limbs, Charmander-like
  // Standing on two legs, tail, more expression
  // ============================================================
  teen: [
    '................', // row 0
    '..BB.......BB...', // row 1 - ears/horns
    '..BPB.....BPB...', // row 2 - ears detail
    '...BBPPPPBB.....', // row 3 - head top
    '..BBPPPPPPBB....', // row 4 - head outline
    '..BPPPPPPPPB....', // row 5 - head
    '..BEPPPPEPPB....', // row 6 - eyes
    '..BPWPPPWPPB....', // row 7 - eye shine
    '..BPPPPPPPPB....', // row 8 - head bottom
    '..BBPPPPPPBB....', // row 9 - neck
    '...BPPPPPPPB....', // row 10 - torso top
    '...BPPPSSPPB....', // row 11 - torso with shading
    '...BPPSSSPPB....', // row 12 - torso bottom
    '..BBPPPPPPBB....', // row 13 - hips
    '.BB.BB..BB.BB...', // row 14 - legs
    '................', // row 15
  ],

  // ============================================================
  // ADULT - Full majestic form, Charizard-like / Blastoise-like
  // Large wings/wings suggestion, proud stance, crown-like features
  // ============================================================
  adult: [
    '..BB.......BB...', // row 0 - horns/wings top
    '.BPPB.....BPPB..', // row 1 - wings
    'BPPPPB...BPPPPB.', // row 2 - wings spread
    'BPPPPBBBBPPPPPB.', // row 3 - head with crown
    'BPPPPPPPPPPPB...', // row 4 - head top
    'BPPPPPPPPPPPB...', // row 5 - head
    'BEPPPPEPPPPEPB..', // row 6 - fierce eyes (triple)
    'BPWPPPWPPPWPPB..', // row 7 - eye shine
    'BPPPPPPPPPPPB...', // row 8 - head bottom
    'BBPPPPPPPPPBB...', // row 9 - neck
    '.BPPPPPPSSPPB...', // row 10 - chest
    '.BPPPSSSSPPPB...', // row 11 - torso shading
    '.BPPSSSSSSPPB...', // row 12 - lower torso
    '.BBPPPPPPPPBB...', // row 13 - hips
    'BB.BB.BB.BB.BB..', // row 14 - legs + tail
    '................', // row 15
  ],
};

// Palette symbols used in the sprites
export const SPRITE_SYMBOLS = {
  TRANSPARENT: '.',
  OUTLINE: 'B',     // #2D3436
  WHITE: 'W',       // #FFFFFF
  PRIMARY: 'P',     // stage primary
  SECONDARY: 'S',   // stage secondary
  ACCENT: 'A',      // stage accent
  EYE: 'E',         // black eyes
  CHEEK: 'H',       // cheek blush
} as const;

// Default palette mapping for any stage (used as base)
// Actual colors are resolved via getColorForSymbol()
export const DEFAULT_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'B': '#2D3436',
  'W': '#FFFFFF',
  'P': '#74B9FF',   // placeholder, overridden by stage colors
  'S': '#0984E3',   // placeholder, overridden by stage colors
  'A': '#E17055',   // placeholder, overridden by stage colors
  'E': '#1a1a2e',
  'H': '#FFC0CB',
};

// Mood-specific pixel overlays
// These are small 1-2 pixel changes applied on top of the base sprite
export interface MoodOverlay {
  type: 'replace' | 'add';
  x: number;
  y: number;
  symbol: string;
}

// Mood-specific modifications (relative pixel changes)
export const MOOD_MODS: Record<string, MoodOverlay[]> = {
  // Most moods use the base sprite; sleeping gets closed eyes
  sleeping: [
    { type: 'replace', x: 5, y: 6, symbol: '.' },  // remove eye white
    { type: 'replace', x: 10, y: 6, symbol: '.' },  // remove eye white
  ],
  happy: [
    // Add a little smile - handled via mouth overlay
  ],
};

// Body type sprite modifiers
// For chubby: add a couple extra body pixels
// For slim: remove a couple body pixels
export function getBodyTypeMods(bodyType: string): Record<string, string[][]> {
  const mods: Record<string, string[][]> = {};

  if (bodyType === 'chubby') {
    // No sprite modification needed - the color palette change handles it
  } else if (bodyType === 'slim') {
    // Same - color palette change handles it
  }

  return mods;
}
