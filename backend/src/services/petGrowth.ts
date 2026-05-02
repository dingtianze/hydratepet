/**
 * Pet Growth Service
 * Handles pet growth calculation, stage transitions, and happiness/health management
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Evolution thresholds based on PRD
export const EVOLUTION_THRESHOLDS = {
  egg: 0,
  baby: 30,      // 3 days
  child: 100,    // 7 days
  teen: 300,     // 21 days
  adult: 600,    // 45 days
};

// Stage display names
export const STAGE_NAMES: Record<string, string> = {
  egg: '蛋',
  baby: '幼年期',
  child: '成长期',
  teen: '青少年期',
  adult: '成熟期',
};

// Mood states
export const MOOD_STATES = {
  HAPPY: 'happy',
  THIRSTY: 'thirsty',
  SAD: 'sad',
  SLEEPY: 'sleepy',
  EXCITED: 'excited',
} as const;

// Body types based on average intake
export const BODY_TYPES = {
  SLIM: 'slim',
  NORMAL: 'normal',
  CHUBBY: 'chubby',
} as const;

interface GrowthCalculationParams {
  amount: number;
  goal: number;
  streakDays: number;
  recordCount: number;
  hasReachedGoal: boolean;
}

interface GrowthResult {
  growth: number;
  bonuses: {
    base: number;
    goalBonus: number;
    streakBonus: number;
    uniformBonus: number;
    excessBonus: number;
  };
}

/**
 * Calculate daily growth based on water intake and other factors
 */
export function calculateDailyGrowth(params: GrowthCalculationParams): GrowthResult {
  const { amount, goal, streakDays, recordCount, hasReachedGoal } = params;

  // Base growth
  const base = 5;

  // Goal completion bonus
  const goalBonus = hasReachedGoal ? 20 : 0;

  // Streak bonus (cap at 50)
  const streakBonus = Math.min(streakDays * 3, 50);

  // Uniform drinking bonus (3+ records with good distribution)
  const uniformBonus = recordCount >= 3 ? 10 : 0;

  // Excess bonus (cap at 10)
  let excessBonus = 0;
  if (amount > goal) {
    excessBonus = Math.min((amount - goal) / 100, 10);
  }

  const totalGrowth = Math.round(base + goalBonus + streakBonus + uniformBonus + excessBonus);

  return {
    growth: totalGrowth,
    bonuses: {
      base,
      goalBonus,
      streakBonus,
      uniformBonus,
      excessBonus,
    },
  };
}

/**
 * Get pet stage based on growth value
 */
export function getPetStage(growth: number): string {
  if (growth >= EVOLUTION_THRESHOLDS.adult) return 'adult';
  if (growth >= EVOLUTION_THRESHOLDS.teen) return 'teen';
  if (growth >= EVOLUTION_THRESHOLDS.child) return 'child';
  if (growth >= EVOLUTION_THRESHOLDS.baby) return 'baby';
  return 'egg';
}

/**
 * Get max growth for current stage (for progress calculation)
 */
export function getMaxGrowthForStage(stage: string): number {
  switch (stage) {
    case 'egg': return EVOLUTION_THRESHOLDS.baby;
    case 'baby': return EVOLUTION_THRESHOLDS.child;
    case 'child': return EVOLUTION_THRESHOLDS.teen;
    case 'teen': return EVOLUTION_THRESHOLDS.adult;
    case 'adult': return EVOLUTION_THRESHOLDS.adult + 1000;
    default: return EVOLUTION_THRESHOLDS.baby;
  }
}

/**
 * Calculate next evolution remaining growth
 */
export function getNextEvolutionGrowth(growth: number, stage: string): number {
  const maxGrowth = getMaxGrowthForStage(stage);
  return Math.max(0, maxGrowth - growth);
}

/**
 * Calculate body type based on average intake
 */
export function calculateBodyType(avgIntake: number, goal: number): string {
  if (avgIntake < goal * 0.5) return BODY_TYPES.SLIM;
  if (avgIntake > goal * 1.2) return BODY_TYPES.CHUBBY;
  return BODY_TYPES.NORMAL;
}

/**
 * Calculate color palette based on drinking time distribution
 * Returns array of hex colors
 */
export function calculateColorPalette(timeDistribution: {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}): string[] {
  const total = timeDistribution.morning + timeDistribution.afternoon + 
                timeDistribution.evening + timeDistribution.night;
  
  if (total === 0) {
    return ['#4ECDC4', '#FFE66D']; // Default colors
  }

  // Calculate percentages
  const morningPct = timeDistribution.morning / total;
  const afternoonPct = timeDistribution.afternoon / total;
  const eveningPct = timeDistribution.evening / total;

  // Morning dominant -> warm colors
  if (morningPct > 0.5) {
    return ['#FF9F43', '#FFE66D'];
  }
  
  // Afternoon dominant -> cool colors
  if (afternoonPct > 0.5) {
    return ['#74B9FF', '#4ECDC4'];
  }
  
  // Evening dominant -> purple/pink
  if (eveningPct > 0.5) {
    return ['#A29BFE', '#FD79A8'];
  }
  
  // Uniform distribution -> rainbow
  if (morningPct > 0.2 && afternoonPct > 0.2 && eveningPct > 0.2) {
    return ['#FF6B6B', '#4ECDC4', '#FFE66D'];
  }

  // Default balanced
  return ['#4ECDC4', '#FFE66D'];
}

/**
 * Calculate pet mood based on health and recent activity
 */
export function calculateMood(health: number, hoursSinceLastFed: number): string {
  if (health >= 80 && hoursSinceLastFed < 4) {
    return MOOD_STATES.HAPPY;
  }
  if (health >= 60 && hoursSinceLastFed < 8) {
    return MOOD_STATES.SLEEPY;
  }
  if (hoursSinceLastFed >= 8) {
    return MOOD_STATES.THIRSTY;
  }
  if (health < 40) {
    return MOOD_STATES.SAD;
  }
  return MOOD_STATES.SLEEPY;
}

/**
 * Calculate health based on recent drinking habits
 * Health decreases if not drinking regularly
 */
export function calculateHealth(
  currentHealth: number,
  hoursSinceLastFed: number,
  dailyGoalReached: boolean
): number {
  let health = currentHealth;

  // Decrease health if not fed for a long time
  if (hoursSinceLastFed > 12) {
    health -= 5;
  } else if (hoursSinceLastFed > 8) {
    health -= 3;
  } else if (hoursSinceLastFed > 4) {
    health -= 1;
  }

  // Increase health if daily goal reached
  if (dailyGoalReached) {
    health += 10;
  }

  // Clamp health between 0 and 100
  return Math.max(0, Math.min(100, health));
}

/**
 * Update pet growth and check for evolution
 */
export async function updatePetGrowth(
  userId: string,
  growthAmount: number
): Promise<{
  pet: any;
  stageChanged: boolean;
  newStage: string | null;
  previousStage: string;
}> {
  const pet = await prisma.pet.findUnique({
    where: { userId },
  });

  if (!pet) {
    throw new Error('Pet not found');
  }

  const previousStage = pet.stage;
  const newGrowth = pet.growth + growthAmount;
  const newStage = getPetStage(newGrowth);
  const stageChanged = newStage !== previousStage;

  const updatedPet = await prisma.pet.update({
    where: { userId },
    data: {
      growth: newGrowth,
      stage: newStage,
      lastFed: new Date(),
      mood: MOOD_STATES.HAPPY,
      health: calculateHealth(pet.health, 0, true),
    },
  });

  logger.info({
    message: 'Pet growth updated',
    userId,
    growthAdded: growthAmount,
    newGrowth,
    stageChanged,
    newStage: stageChanged ? newStage : null,
  });

  return {
    pet: updatedPet,
    stageChanged,
    newStage: stageChanged ? newStage : null,
    previousStage,
  };
}

/**
 * Get pet status summary
 */
export async function getPetStatus(userId: string) {
  const pet = await prisma.pet.findUnique({
    where: { userId },
  });

  if (!pet) {
    throw new Error('Pet not found');
  }

  // Calculate hours since last fed
  const hoursSinceLastFed = pet.lastFed 
    ? (Date.now() - new Date(pet.lastFed).getTime()) / (1000 * 60 * 60)
    : 24;

  // Get today's summary
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySummary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  const dailyGoalReached = todaySummary?.goalReached || false;

  // Calculate current mood
  const currentMood = calculateMood(pet.health, hoursSinceLastFed);
  
  // Calculate next evolution
  const nextEvolution = getNextEvolutionGrowth(pet.growth, pet.stage);
  const maxGrowth = getMaxGrowthForStage(pet.stage);
  const progressPercent = Math.round((pet.growth / maxGrowth) * 100);

  return {
    id: pet.id,
    name: pet.name,
    stage: pet.stage,
    stageName: STAGE_NAMES[pet.stage],
    growth: pet.growth,
    maxGrowth,
    nextEvolution,
    progressPercent: Math.min(100, progressPercent),
    bodyType: pet.bodyType,
    colorPalette: pet.colorPalette,
    accessories: JSON.parse(pet.accessories || '[]'),
    mood: currentMood,
    health: pet.health,
    hoursSinceLastFed: Math.round(hoursSinceLastFed),
    dailyGoalReached,
    lastFed: pet.lastFed,
  };
}

/**
 * Daily pet status update (scheduled job)
 * Decreases health if not fed, updates mood
 */
export async function dailyPetUpdate(userId: string): Promise<void> {
  const pet = await prisma.pet.findUnique({
    where: { userId },
  });

  if (!pet) {
    logger.warn({ message: 'Pet not found for daily update', userId });
    return;
  }

  // Calculate hours since last fed
  const hoursSinceLastFed = pet.lastFed 
    ? (Date.now() - new Date(pet.lastFed).getTime()) / (1000 * 60 * 60)
    : 24;

  // Get yesterday's summary
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const yesterdaySummary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId,
        date: yesterday,
      },
    },
  });

  const dailyGoalReached = yesterdaySummary?.goalReached || false;

  // Calculate new health and mood
  const newHealth = calculateHealth(pet.health, hoursSinceLastFed, dailyGoalReached);
  const newMood = calculateMood(newHealth, hoursSinceLastFed);

  await prisma.pet.update({
    where: { userId },
    data: {
      health: newHealth,
      mood: newMood,
    },
  });

  logger.info({
    message: 'Daily pet update completed',
    userId,
    newHealth,
    newMood,
    hoursSinceLastFed: Math.round(hoursSinceLastFed),
  });
}

/**
 * Batch update all pets (for scheduled cron job)
 */
export async function batchDailyPetUpdate(): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  logger.info({ message: 'Starting batch pet update', userCount: users.length });

  for (const user of users) {
    try {
      await dailyPetUpdate(user.id);
    } catch (error) {
      logger.error({
        message: 'Failed to update pet',
        userId: user.id,
        error: (error as Error).message,
      });
    }
  }

  logger.info({ message: 'Batch pet update completed' });
}

/**
 * Initialize pet for new user
 */
export async function initializePet(userId: string, name: string = '小水滴') {
  const existingPet = await prisma.pet.findUnique({
    where: { userId },
  });

  if (existingPet) {
    throw new Error('Pet already exists for this user');
  }

  const pet = await prisma.pet.create({
    data: {
      userId,
      name,
      stage: 'egg',
      growth: 0,
      mood: MOOD_STATES.HAPPY,
      health: 100,
      accessories: '[]',
      colorPalette: '["#4ECDC4", "#FFE66D"]',
    },
  });

  logger.info({
    message: 'Pet initialized',
    userId,
    petId: pet.id,
    name,
  });

  return pet;
}
