import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Pet, PetStage, PetMood, BodyType } from '@/types/index';

interface PetAvatarProps {
  pet: Pet | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onInteract?: () => void;
  isInteractive?: boolean;
}

// Pixel art color palettes based on body type and stage
const COLOR_PALETTES: Record<BodyType, string[]> = {
  slim: ['#74B9FF', '#0984E3', '#74B9FF'],
  normal: ['#55EFC4', '#00B894', '#55EFC4'],
  chubby: ['#FD79A8', '#E84393', '#FD79C0'],
};

const STAGE_COLORS: Record<PetStage, { primary: string; secondary: string; accent: string }> = {
  egg: { primary: '#FFEAA7', secondary: '#FDCB6E', accent: '#E17055' },
  baby: { primary: '#74B9FF', secondary: '#0984E3', accent: '#A29BFE' },
  child: { primary: '#55EFC4', secondary: '#00B894', accent: '#00CEC9' },
  teen: { primary: '#FD79A8', secondary: '#E84393', accent: '#FDCB6E' },
  adult: { primary: '#A29BFE', secondary: '#6C5CE7', accent: '#FD79A8' },
};

const MOOD_CONFIG: Record<PetMood, { emoji: string; bounce: number; color: string }> = {
  happy: { emoji: '✨', bounce: 1.2, color: '#FDCB6E' },
  normal: { emoji: '✨', bounce: 1.1, color: '#74B9FF' },
  thirsty: { emoji: '💧', bounce: 0.9, color: '#74B9FF' },
  sad: { emoji: '💔', bounce: 0.8, color: '#636E72' },
  sleeping: { emoji: 'z', bounce: 0.5, color: '#B2BEC3' },
};

// Pixel art SVG components for each stage
const PixelEgg = ({ colors }: { colors: { primary: string; secondary: string; accent: string } }) => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    {/* Egg shadow */}
    <ellipse cx="32" cy="58" rx="20" ry="4" fill="rgba(0,0,0,0.2)" />
    {/* Egg body */}
    <ellipse cx="32" cy="36" rx="24" ry="28" fill={colors.primary} />
    <ellipse cx="32" cy="36" rx="20" ry="24" fill={colors.secondary} opacity="0.6" />
    {/* Egg spots */}
    <circle cx="24" cy="28" r="4" fill={colors.accent} opacity="0.5" />
    <circle cx="40" cy="32" r="3" fill={colors.accent} opacity="0.5" />
    <circle cx="30" cy="44" r="2" fill={colors.accent} opacity="0.5" />
    {/* Shine */}
    <ellipse cx="28" cy="24" rx="6" ry="8" fill="white" opacity="0.4" />
  </svg>
);

const PixelBaby = ({ colors, mood, bodyType }: { colors: { primary: string; secondary: string; accent: string }; mood: PetMood; bodyType: BodyType }) => {
  const palette = COLOR_PALETTES[bodyType];
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Shadow */}
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="rgba(0,0,0,0.2)" />
      {/* Body */}
      <ellipse cx="32" cy="40" rx="20" ry="16" fill={palette[0]} />
      <ellipse cx="32" cy="40" rx="16" ry="12" fill={palette[1]} opacity="0.5" />
      {/* Head */}
      <circle cx="32" cy="28" r="14" fill={palette[0]} />
      {/* Eyes */}
      {mood === 'sleeping' ? (
        <>
          <line x1="26" y1="26" x2="30" y2="28" stroke="#2D3436" strokeWidth="2" />
          <line x1="34" y1="28" x2="38" y2="26" stroke="#2D3436" strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="26" cy="28" r="3" fill="#2D3436" />
          <circle cx="38" cy="28" r="3" fill="#2D3436" />
          <circle cx="27" cy="27" r="1" fill="white" />
          <circle cx="39" cy="27" r="1" fill="white" />
        </>
      )}
      {/* Cheeks */}
      <circle cx="22" cy="32" r="3" fill={colors.accent} opacity="0.4" />
      <circle cx="42" cy="32" r="3" fill={colors.accent} opacity="0.4" />
      {/* Mouth */}
      {mood === 'happy' && <path d="M 28 34 Q 32 38 36 34" stroke="#2D3436" strokeWidth="2" fill="none" />}
      {mood === 'sad' && <path d="M 28 38 Q 32 34 36 38" stroke="#2D3436" strokeWidth="2" fill="none" />}
      {mood === 'normal' && <line x1="30" y1="36" x2="34" y2="36" stroke="#2D3436" strokeWidth="2" />}
      {/* Shine */}
      <ellipse cx="26" cy="22" rx="4" ry="3" fill="white" opacity="0.5" />
    </svg>
  );
};

const PixelChild = ({ colors, mood, bodyType }: { colors: { primary: string; secondary: string; accent: string }; mood: PetMood; bodyType: BodyType }) => {
  const palette = COLOR_PALETTES[bodyType];
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Shadow */}
      <ellipse cx="32" cy="58" rx="20" ry="4" fill="rgba(0,0,0,0.2)" />
      {/* Body */}
      <ellipse cx="32" cy="42" rx="22" ry="14" fill={palette[0]} />
      <ellipse cx="32" cy="42" rx="18" ry="10" fill={palette[1]} opacity="0.5" />
      {/* Arms */}
      <ellipse cx="14" cy="40" rx="6" ry="4" fill={palette[0]} />
      <ellipse cx="50" cy="40" rx="6" ry="4" fill={palette[0]} />
      {/* Head */}
      <circle cx="32" cy="26" r="16" fill={palette[0]} />
      {/* Eyes */}
      {mood === 'sleeping' ? (
        <>
          <line x1="24" y1="24" x2="30" y2="26" stroke="#2D3436" strokeWidth="2" />
          <line x1="34" y1="26" x2="40" y2="24" stroke="#2D3436" strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="24" cy="26" r="4" fill="#2D3436" />
          <circle cx="40" cy="26" r="4" fill="#2D3436" />
          <circle cx="25" cy="25" r="1.5" fill="white" />
          <circle cx="41" cy="25" r="1.5" fill="white" />
        </>
      )}
      {/* Cheeks */}
      <circle cx="18" cy="30" r="4" fill={colors.accent} opacity="0.4" />
      <circle cx="46" cy="30" r="4" fill={colors.accent} opacity="0.4" />
      {/* Mouth */}
      {mood === 'happy' && <path d="M 26 32 Q 32 38 38 32" stroke="#2D3436" strokeWidth="2" fill="none" />}
      {mood === 'sad' && <path d="M 26 36 Q 32 30 38 36" stroke="#2D3436" strokeWidth="2" fill="none" />}
      {mood === 'normal' && <ellipse cx="32" cy="34" rx="3" ry="2" fill="#2D3436" />}
      {/* Crown/Hair */}
      <path d="M 24 12 L 28 18 L 32 12 L 36 18 L 40 12" stroke={colors.accent} strokeWidth="2" fill="none" />
    </svg>
  );
};

const PixelTeen = ({ colors, mood, bodyType }: { colors: { primary: string; secondary: string; accent: string }; mood: PetMood; bodyType: BodyType }) => {
  const palette = COLOR_PALETTES[bodyType];
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Shadow */}
      <ellipse cx="32" cy="58" rx="22" ry="4" fill="rgba(0,0,0,0.2)" />
      {/* Body */}
      <ellipse cx="32" cy="44" rx="24" ry="12" fill={palette[0]} />
      <ellipse cx="32" cy="44" rx="20" ry="8" fill={palette[1]} opacity="0.5" />
      {/* Arms with hands */}
      <circle cx="12" cy="42" r="7" fill={palette[0]} />
      <circle cx="52" cy="42" r="7" fill={palette[0]} />
      {/* Head */}
      <circle cx="32" cy="24" r="18" fill={palette[0]} />
      {/* Eyes - more expressive */}
      {mood === 'sleeping' ? (
        <>
          <path d="M 22 22 Q 26 26 30 22" stroke="#2D3436" strokeWidth="2" fill="none" />
          <path d="M 34 22 Q 38 26 42 22" stroke="#2D3436" strokeWidth="2" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="24" cy="24" rx="5" ry="6" fill="#2D3436" />
          <ellipse cx="40" cy="24" rx="5" ry="6" fill="#2D3436" />
          <circle cx="25" cy="22" r="2" fill="white" />
          <circle cx="41" cy="22" r="2" fill="white" />
        </>
      )}
      {/* Cheeks */}
      <ellipse cx="16" cy="28" rx="5" ry="3" fill={colors.accent} opacity="0.4" />
      <ellipse cx="48" cy="28" rx="5" ry="3" fill={colors.accent} opacity="0.4" />
      {/* Mouth */}
      {mood === 'happy' && <path d="M 24 32 Q 32 40 40 32" stroke="#2D3436" strokeWidth="2.5" fill="none" />}
      {mood === 'sad' && <path d="M 24 38 Q 32 30 40 38" stroke="#2D3436" strokeWidth="2.5" fill="none" />}
      {mood === 'thirsty' && <ellipse cx="32" cy="36" rx="4" ry="5" fill="#636E72" />}
      {mood === 'normal' && <path d="M 28 34 L 32 36 L 36 34" stroke="#2D3436" strokeWidth="2" fill="none" />}
      {/* Hair tuft */}
      <path d="M 28 8 Q 32 2 36 8" stroke={palette[1]} strokeWidth="3" fill="none" />
      <path d="M 24 10 Q 32 4 40 10" stroke={palette[1]} strokeWidth="2" fill="none" />
    </svg>
  );
};

const PixelAdult = ({ colors, mood, bodyType }: { colors: { primary: string; secondary: string; accent: string }; mood: PetMood; bodyType: BodyType }) => {
  const palette = COLOR_PALETTES[bodyType];
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Shadow */}
      <ellipse cx="32" cy="60" rx="24" ry="4" fill="rgba(0,0,0,0.2)" />
      {/* Flowing body */}
      <path d="M 16 48 Q 32 56 48 48 Q 52 40 48 36 Q 32 44 16 36 Q 12 40 16 48" fill={palette[0]} />
      <ellipse cx="32" cy="42" rx="22" ry="10" fill={palette[1]} opacity="0.5" />
      {/* Arms with elegant hands */}
      <ellipse cx="10" cy="40" rx="8" ry="6" fill={palette[0]} />
      <ellipse cx="54" cy="40" rx="8" ry="6" fill={palette[0]} />
      {/* Head */}
      <circle cx="32" cy="22" r="20" fill={palette[0]} />
      {/* Elegant eyes */}
      {mood === 'sleeping' ? (
        <>
          <path d="M 20 20 Q 26 26 32 20" stroke="#2D3436" strokeWidth="2" fill="none" />
          <path d="M 32 20 Q 38 26 44 20" stroke="#2D3436" strokeWidth="2" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="24" cy="22" rx="6" ry="7" fill="#2D3436" />
          <ellipse cx="40" cy="22" rx="6" ry="7" fill="#2D3436" />
          <circle cx="25" cy="20" r="2.5" fill="white" />
          <circle cx="41" cy="20" r="2.5" fill="white" />
          {/* Eyelashes */}
          <line x1="18" y1="20" x2="16" y2="16" stroke="#2D3436" strokeWidth="1.5" />
          <line x1="46" y1="20" x2="48" y2="16" stroke="#2D3436" strokeWidth="1.5" />
        </>
      )}
      {/* Cheeks */}
      <ellipse cx="14" cy="26" rx="6" ry="4" fill={colors.accent} opacity="0.4" />
      <ellipse cx="50" cy="26" rx="6" ry="4" fill={colors.accent} opacity="0.4" />
      {/* Mouth */}
      {mood === 'happy' && <path d="M 24 32 Q 32 42 40 32" stroke="#2D3436" strokeWidth="3" fill="none" />}
      {mood === 'sad' && <path d="M 24 38 Q 32 28 40 38" stroke="#2D3436" strokeWidth="3" fill="none" />}
      {mood === 'thirsty' && <ellipse cx="32" cy="34" rx="5" ry="6" fill="#636E72" />}
      {mood === 'normal' && <path d="M 28 34 Q 32 36 36 34" stroke="#2D3436" strokeWidth="2" fill="none" />}
      {/* Crown/Aura for adult */}
      <ellipse cx="32" cy="6" rx="12" ry="4" fill={colors.accent} opacity="0.3" />
      <circle cx="24" cy="4" r="2" fill={colors.accent} />
      <circle cx="32" cy="2" r="2" fill={colors.accent} />
      <circle cx="40" cy="4" r="2" fill={colors.accent} />
    </svg>
  );
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

  const colors = STAGE_COLORS[pet.stage];
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

  const renderPetByStage = () => {
    switch (pet.stage) {
      case 'egg':
        return <PixelEgg colors={colors} />;
      case 'baby':
        return <PixelBaby colors={colors} mood={pet.mood} bodyType={pet.bodyType} />;
      case 'child':
        return <PixelChild colors={colors} mood={pet.mood} bodyType={pet.bodyType} />;
      case 'teen':
        return <PixelTeen colors={colors} mood={pet.mood} bodyType={pet.bodyType} />;
      case 'adult':
        return <PixelAdult colors={colors} mood={pet.mood} bodyType={pet.bodyType} />;
      default:
        return <PixelEgg colors={colors} />;
    }
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

        {/* Pet SVG */}
        <div className="relative z-10 w-full h-full">
          {renderPetByStage()}
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
