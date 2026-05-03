import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EvolutionAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

// Pixel block burst configuration
const PIXEL_COUNT = 32;
const COLORS = ['#FFEAA7', '#FDCB6E', '#E17055', '#74B9FF', '#55EFC4', '#FD79A8', '#A29BFE', '#00CEC9'];
const GRID_SIZE = 8; // 8x8 grid for pixel explosion

// Generate pixel blocks that move outward in a pixel-grid pattern
function getPixelBlocks() {
  const blocks = [];
  for (let i = 0; i < PIXEL_COUNT; i++) {
    const gridX = i % GRID_SIZE;
    const gridY = Math.floor(i / GRID_SIZE);
    // Center of grid offset
    const cx = gridX - GRID_SIZE / 2 + 0.5;
    const cy = gridY - GRID_SIZE / 2 + 0.5;
    const angle = Math.atan2(cy, cx);
    const distance = 30 + Math.random() * 50;
    const size = 6 + Math.random() * 8;
    blocks.push({
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      width: size,
      height: size,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
      delay: Math.random() * 0.3,
    });
  }
  return blocks;
}

export function EvolutionAnimation({ show, onComplete }: EvolutionAnimationProps) {
  const pixelBlocks = useRef(getPixelBlocks());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (show) {
      // Reset pixel blocks on each show
      pixelBlocks.current = getPixelBlocks();

      // Call onComplete after animation finishes (~2000ms)
      timeoutRef.current = setTimeout(() => {
        onComplete?.();
      }, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          {/* Phase 1: White flash overlay */}
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, times: [0, 0.25, 0.5] }}
          />

          {/* Phase 2: Pixel block silhouette expansion */}
          <motion.div
            className="absolute"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{
              scale: [0.8, 1.2, 1],
              opacity: [0.5, 0.8, 0],
            }}
            transition={{ duration: 1.0, times: [0, 0.3, 0.6], ease: 'easeOut' }}
          >
            <svg width="120" height="120" viewBox="0 0 64 64">
              {/* Pixel-block silhouette instead of smooth circle */}
              {Array.from({ length: 10 }, (_, i) => (
                <rect
                  key={i}
                  x={12 + (i % 5) * 8}
                  y={12 + Math.floor(i / 5) * 8}
                  width={8}
                  height={8}
                  fill="#2D3436"
                  opacity="0.6"
                  rx={1}
                />
              ))}
            </svg>
          </motion.div>

          {/* Phase 3: Pixel block burst explosion */}
          {pixelBlocks.current.map((block) => (
            <motion.div
              key={block.id}
              className="absolute"
              style={{
                width: block.width,
                height: block.height,
                backgroundColor: block.color,
                borderRadius: '2px',
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.5, rotate: 0 }}
              animate={{
                x: block.x,
                y: block.y,
                opacity: [1, 1, 0],
                scale: [0.5, 1.2, 0.3],
                rotate: block.rotation,
              }}
              transition={{
                duration: 0.8,
                delay: 0.3 + block.delay * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}

          {/* Phase 4: New pixel form sparkle */}
          <motion.div
            className="absolute"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2, ease: 'easeOut' }}
          >
            <svg width="80" height="80" viewBox="0 0 64 64">
              {/* Pixel-style star/sparkle using rects instead of path */}
              {[
                [28, 8, 8, 8],   // top
                [12, 28, 8, 8],   // left
                [28, 20, 8, 8],   // center
                [44, 28, 8, 8],   // right
                [28, 36, 8, 8],   // bottom
                [20, 14, 8, 8],   // top-left inner
                [36, 14, 8, 8],   // top-right inner
                [20, 34, 8, 8],   // bottom-left inner
                [36, 34, 8, 8],   // bottom-right inner
              ].map(([x, y, w, h], i) => (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="#FDCB6E"
                  opacity={i === 2 ? 0.9 : 0.6}
                  rx={1}
                />
              ))}
            </svg>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default EvolutionAnimation;
