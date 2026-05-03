import type { PetStage, PetMood, BodyType } from '@/types/index';
import { SPRITES } from './pixelSprites';

// Stage-specific color palettes (from original PetAvatar.tsx)
const STAGE_COLORS: Record<PetStage, { primary: string; secondary: string; accent: string }> = {
  egg: { primary: '#FFEAA7', secondary: '#FDCB6E', accent: '#E17055' },
  baby: { primary: '#74B9FF', secondary: '#0984E3', accent: '#A29BFE' },
  child: { primary: '#55EFC4', secondary: '#00B894', accent: '#00CEC9' },
  teen: { primary: '#FD79A8', secondary: '#E84393', accent: '#FDCB6E' },
  adult: { primary: '#A29BFE', secondary: '#6C5CE7', accent: '#FD79A8' },
};

// BodyType color palette overrides
const BODY_PALETTES: Record<BodyType, { primary: string; secondary: string; accent: string }> = {
  slim: { primary: '#74B9FF', secondary: '#0984E3', accent: '#A29BFE' },
  normal: { primary: '#55EFC4', secondary: '#00B894', accent: '#FDCB6E' },
  chubby: { primary: '#FD79A8', secondary: '#E84393', accent: '#FDCB6E' },
};

// Symbol-to-color mapping function
// Maps sprite symbols (B, P, S, A, E, W, .) to actual hex colors
function getColorForSymbol(
  symbol: string,
  stage: PetStage,
  bodyType: BodyType,
): string {
  const stageColor = STAGE_COLORS[stage];
  const bodyColor = BODY_PALETTES[bodyType];

  // For egg stage, use egg colors regardless of bodyType
  if (stage === 'egg') {
    switch (symbol) {
      case 'B': return '#2D3436';
      case 'W': return '#FFFFFF';
      case 'P': return stageColor.primary;   // #FFEAA7 egg shell
      case 'S': return stageColor.secondary; // #FDCB6E egg shading
      case 'A': return stageColor.accent;    // #E17055 egg spots
      case 'E': return '#1a1a2e';
      case 'H': return '#FFEAA7';
      default: return 'transparent';
    }
  }

  // For other stages, use bodyType-adjusted colors
  switch (symbol) {
    case 'B': return '#2D3436'; // outline always black
    case 'W': return '#FFFFFF'; // white highlight
    case 'P': return bodyColor.primary;   // body main color
    case 'S': return bodyColor.secondary; // body shading
    case 'A': return bodyColor.accent;    // accent details
    case 'E': return '#1a1a2e'; // dark eyes
    case 'H': return bodyColor.accent + '66'; // cheek blush (semi-transparent)
    default: return 'transparent';
  }
}

// Mood pixel overlays
// Returns modified pixel positions for mood-specific features
function getMoodPixels(
  stage: PetStage,
  mood: PetMood,
): Array<{ x: number; y: number; symbol: string; stage: PetStage }> {
  const moodPixels: Array<{ x: number; y: number; symbol: string; stage: PetStage }> = [];

  // Base eye positions differ per stage
  const eyeConfigs: Record<PetStage, { leftEye: [number, number]; rightEye: [number, number]; eyeWhite: [number, number][] }> = {
    egg: { leftEye: [0, 0], rightEye: [0, 0], eyeWhite: [] },
    baby: { leftEye: [4, 5], rightEye: [10, 5], eyeWhite: [[5, 6], [11, 6]] },
    child: { leftEye: [4, 6], rightEye: [10, 6], eyeWhite: [[5, 7], [11, 7]] },
    teen: { leftEye: [4, 6], rightEye: [10, 6], eyeWhite: [[5, 7], [11, 7]] },
    adult: { leftEye: [3, 6], rightEye: [11, 6], eyeWhite: [[4, 7], [12, 7]] },
  };

  if (stage === 'egg') return moodPixels; // Egg has no mood expressions

  const eyes = eyeConfigs[stage];

  if (mood === 'sleeping') {
    // Closed eyes: replace eye circles with horizontal dashes
    moodPixels.push({ x: eyes.leftEye[0], y: eyes.leftEye[1], symbol: 'B', stage });
    moodPixels.push({ x: eyes.rightEye[0], y: eyes.rightEye[1], symbol: 'B', stage });
    moodPixels.push({ x: eyes.leftEye[0] + 1, y: eyes.leftEye[1], symbol: 'B', stage });
    moodPixels.push({ x: eyes.rightEye[0] - 1, y: eyes.rightEye[1], symbol: 'B', stage });
    // Remove eye whites
    eyes.eyeWhite.forEach(([wx, wy]) => {
      moodPixels.push({ x: wx, y: wy, symbol: 'P', stage });
    });
  } else if (mood === 'happy') {
    // Add smile pixels below eyes
    const mouthY = stage === 'baby' ? 8 : stage === 'child' ? 9 : stage === 'teen' ? 9 : 9;
    moodPixels.push({ x: 6, y: mouthY, symbol: 'B', stage });
    moodPixels.push({ x: 7, y: mouthY, symbol: 'B', stage });
    moodPixels.push({ x: 8, y: mouthY, symbol: 'B', stage });
  } else if (mood === 'sad') {
    // Sad mouth (upside down)
    const mouthY = stage === 'baby' ? 9 : stage === 'child' ? 10 : stage === 'teen' ? 10 : 10;
    moodPixels.push({ x: 7, y: mouthY, symbol: 'B', stage });
    moodPixels.push({ x: 8, y: mouthY, symbol: 'B', stage });
  } else if (mood === 'thirsty') {
    // Tongue out
    const tongueY = stage === 'baby' ? 9 : stage === 'child' ? 10 : stage === 'teen' ? 10 : 10;
    moodPixels.push({ x: 7, y: tongueY, symbol: 'A', stage });
    moodPixels.push({ x: 8, y: tongueY, symbol: 'A', stage });
  }

  return moodPixels;
}

// Copy a 2D pixel grid (string[][] from SPRITES)
function cloneSprite(sprite: string[]): string[][] {
  return sprite.map(row => row.split(''));
}

// Resolve a modified pixel grid for a given stage, mood
function buildPixelGrid(
  stage: PetStage,
  mood: PetMood,
  bodyType: BodyType,
): { grid: string[][]; colors: (symbol: string) => string } {
  const baseSprite = SPRITES[stage];
  if (!baseSprite) {
    throw new Error(`Unknown stage: ${stage}`);
  }

  const grid = cloneSprite(baseSprite);

  // Apply mood overlays
  const moodMods = getMoodPixels(stage, mood);
  for (const mod of moodMods) {
    if (grid[mod.y] && grid[mod.y][mod.x] !== undefined) {
      grid[mod.y][mod.x] = mod.symbol;
    }
  }

  // Create color resolver bound to this stage/mood/bodyType
  const colorResolver = (symbol: string): string => {
    return getColorForSymbol(symbol, stage, bodyType);
  };

  return { grid, colors: colorResolver };
}

// ============================================================
// PixelSprite Component
// Renders a pixel grid as SVG rect elements
// ============================================================
interface PixelSpriteProps {
  stage: PetStage;
  mood: PetMood;
  bodyType: BodyType;
  pixelSize?: number;
}

export function PixelSprite({
  stage,
  mood,
  bodyType,
  pixelSize = 4,
}: PixelSpriteProps) {
  const { grid, colors } = buildPixelGrid(stage, mood, bodyType);
  const gridWidth = grid[0]?.length ?? 16;
  const gridHeight = grid.length;
  const viewWidth = gridWidth * pixelSize;
  const viewHeight = gridHeight * pixelSize;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    >
      {grid.map((row, y) =>
        row.map((cell, x) => {
          if (cell === '.') return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={colors(cell)}
              shapeRendering="crispEdges"
            />
          );
        }),
      )}
    </svg>
  );
}

export { STAGE_COLORS, BODY_PALETTES };
