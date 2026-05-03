import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Pet, PetMood } from '@/types/index';
import { PixelSprite } from './PixelSpriteRenderer';

interface PetAvatarProps {
  pet: Pet | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onInteract?: () => void;
  isInteractive?: boolean;
}

const MOOD_CONFIG: Record<PetMood, { emoji: string; bounce: number; color: string }> = {
  happy: { emoji: '✨', bounce: 1.2, color: '#FDCB6E' },
  normal: { emoji: '✨', bounce: 1.1, color: '#74B9FF' },
  thirsty: { emoji: '💧', bounce: 0.9, color: '#74B9FF' },
  sad: { emoji: '💔', bounce: 0.8, color: '#636E72' },
  sleeping: { emoji: 'z', bounce: 0.5, color: '#B2BEC3' },
};

// Particle effect for interactions
const InteractionParticles = ({ x, y }: { x: number; y: number }) => {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i * 60) * (Math.PI / 180),
    distance: 30 + Math.random() * 20,
  }));

  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ x, y, opacity: 1, scale: 0.5 }}
          animate={{
            x: x + Math.cos(particle.angle) * particle.distance,
            y: y + Math.sin(particle.angle) * particle.distance,
            opacity: 0,
            scale: 1.5,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute pointer-events-none"
          style={{ left: 0, top: 0 }}
        >
          <span className="text-lg">✨</span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

// Heart popup for happy interactions
const HeartPopup = ({ x, y }: { x: number; y: number }) => (
  <motion.div
    initial={{ x, y, opacity: 1, scale: 0 }}
    animate={{ y: y - 50, opacity: 0, scale: 1.2 }}
    transition={{ duration: 1, ease: 'easeOut' }}
    className="absolute pointer-events-none"
    style={{ left: 0, top: 0 }}
  >
    <span className="text-2xl">❤️</span>
  </motion.div>
);

export function PetAvatar({ pet, size = 'md', onInteract, isInteractive = true }: PetAvatarProps) {
  const [isClicked, setIsClicked] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [showParticles, setShowParticles] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
  };

  if (!pet) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-200 rounded-full flex items-center justify-center`}>
        <span className="text-4xl">🎮</span>
      </div>
    );
  }

  const moodConfig = MOOD_CONFIG[pet.mood];

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClickPosition({ x, y });
    setIsClicked(true);
    setShowParticles(true);

    // Add heart
    const newHeart = { id: Date.now(), x, y };
    setHearts((prev) => [...prev, newHeart]);

    // Call onInteract callback
    onInteract?.();

    // Reset animations
    setTimeout(() => {
      setIsClicked(false);
      setShowParticles(false);
    }, 300);

    // Remove heart after animation
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);
  };

  return (
    <div className="relative">
      {/* Pet container */}
      <motion.div
        className={`${sizeClasses[size]} relative cursor-pointer select-none`}
        onClick={handleClick}
        animate={{
          scale: isClicked ? 0.9 : 1,
          y: pet.mood === 'sleeping' ? [0, -2, 0] : [0, -5, 0],
        }}
        transition={{
          scale: { duration: 0.1 },
          y: {
            duration: pet.mood === 'sleeping' ? 3 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        whileHover={isInteractive ? { scale: 1.05 } : {}}
        whileTap={isInteractive ? { scale: 0.95 } : {}}
      >
        {/* Glow effect based on mood */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          animate={{
            backgroundColor: moodConfig.color,
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Pet Pixel Sprite */}
        <div className="relative z-10 w-full h-full">
          <PixelSprite
            stage={pet.stage}
            mood={pet.mood}
            bodyType={pet.bodyType}
            pixelSize={4}
          />
        </div>

        {/* Mood indicator */}
        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-lg">{moodConfig.emoji}</span>
        </motion.div>
      </motion.div>

      {/* Particles on click */}
      {showParticles && <InteractionParticles x={clickPosition.x} y={clickPosition.y} />}

      {/* Hearts */}
      <AnimatePresence>
        {hearts.map((heart) => (
          <HeartPopup key={heart.id} x={heart.x} y={heart.y} />
        ))}
      </AnimatePresence>

      {/* Sleep zzz animation */}
      {pet.mood === 'sleeping' && (
        <motion.div
          className="absolute -top-4 left-1/2 text-gray-400 font-bold"
          animate={{
            y: [-5, -15],
            opacity: [1, 0],
            x: [0, 10],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        >
          z
        </motion.div>
      )}
    </div>
  );
}

export default PetAvatar;
