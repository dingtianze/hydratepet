/**
 * Pet Update Scheduled Job
 * Runs daily at midnight to update pet status for all users
 * - Decreases health if not fed
 * - Updates mood based on recent activity
 * - Resets daily bonuses
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { 
  calculateHealth, 
  calculateMood,
  calculateBodyType,
  calculateColorPalette,
  batchDailyPetUpdate 
} from '../services/petGrowth';

/**
 * Update pet status for a single user
 * Called daily at midnight
 */
export async function updatePetStatus(userId: string): Promise<void> {
  try {
    const pet = await prisma.pet.findUnique({
      where: { userId },
    });

    if (!pet) {
      logger.warn({ message: 'Pet not found for daily update', userId });
      return;
    }

    // Calculate hours since last fed
    const now = new Date();
    const hoursSinceLastFed = pet.lastFed 
      ? (now.getTime() - new Date(pet.lastFed).getTime()) / (1000 * 60 * 60)
      : 24;

    // Get yesterday's summary to check if goal was reached
    const yesterday = new Date(now);
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

    // Calculate new health
    const newHealth = calculateHealth(pet.health, hoursSinceLastFed, dailyGoalReached);
    
    // Calculate new mood
    const newMood = calculateMood(newHealth, hoursSinceLastFed);

    // Get last 7 days data for body type calculation
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSummaries = await prisma.dailySummary.findMany({
      where: {
        userId,
        date: {
          gte: sevenDaysAgo,
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyGoal: true },
    });

    const goal = user?.dailyGoal || 1500;
    const avgIntake = recentSummaries.length > 0
      ? recentSummaries.reduce((sum, s) => sum + s.totalAmount, 0) / recentSummaries.length
      : goal;

    // Calculate body type based on average intake
    const bodyType = calculateBodyType(avgIntake, goal);

    // Get last 30 days records for time distribution
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = await prisma.waterRecord.findMany({
      where: {
        userId,
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calculate time distribution
    const distribution = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };

    recentRecords.forEach(record => {
      const hour = new Date(record.timestamp).getHours();
      if (hour >= 6 && hour < 12) {
        distribution.morning += record.amount;
      } else if (hour >= 12 && hour < 18) {
        distribution.afternoon += record.amount;
      } else if (hour >= 18 && hour < 22) {
        distribution.evening += record.amount;
      } else {
        distribution.night += record.amount;
      }
    });

    // Calculate color palette based on time distribution
    const colorPalette = calculateColorPalette(distribution);

    // Update pet
    await prisma.pet.update({
      where: { userId },
      data: {
        health: newHealth,
        mood: newMood,
        bodyType,
        colorPalette: JSON.stringify(colorPalette),
      },
    });

    logger.info({
      message: 'Pet status updated',
      userId,
      newHealth,
      newMood,
      bodyType,
      hoursSinceLastFed: Math.round(hoursSinceLastFed),
      dailyGoalReached,
    });
  } catch (error) {
    logger.error({
      message: 'Failed to update pet status',
      userId,
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Run daily pet update for all users
 * This should be scheduled to run at midnight every day
 */
export async function runDailyPetUpdate(): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  try {
    logger.info({ message: 'Starting daily pet update job' });

    // Get all users with pets
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: { id: true },
    });

    logger.info({ message: 'Found users to process', count: users.length });

    for (const user of users) {
      try {
        await updatePetStatus(user.id);
        processed++;
      } catch (error) {
        failed++;
        const errorMsg = `User ${user.id}: ${(error as Error).message}`;
        errors.push(errorMsg);
        logger.error({ message: errorMsg });
      }
    }

    const success = failed === 0;
    
    logger.info({
      message: 'Daily pet update job completed',
      processed,
      failed,
      success,
    });

    return {
      success,
      processed,
      failed,
      errors,
    };
  } catch (error) {
    const errorMsg = `Job failed: ${(error as Error).message}`;
    logger.error({ message: errorMsg });
    
    return {
      success: false,
      processed,
      failed,
      errors: [...errors, errorMsg],
    };
  }
}

/**
 * Schedule the daily pet update job
 * Uses node-cron for scheduling
 */
export function schedulePetUpdateJob(): void {
  // This function would be called to set up the cron job
  // For now, we'll provide the setup code that can be used
  
  /*
  import cron from 'node-cron';
  
  // Run at midnight every day (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily pet update job...');
    await runDailyPetUpdate();
  });
  
  console.log('Pet update job scheduled for midnight daily');
  */
}

/**
 * Manual trigger endpoint handler
 * Can be called via API to manually trigger the update
 */
export async function manualPetUpdate(userId?: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  if (userId) {
    try {
      await updatePetStatus(userId);
      return {
        success: true,
        message: `Pet updated for user ${userId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update pet: ${(error as Error).message}`,
      };
    }
  }

  const result = await runDailyPetUpdate();
  return {
    success: result.success,
    message: `Processed ${result.processed} pets, ${result.failed} failed`,
    details: result,
  };
}

/**
 * Check and update pet for a specific user (on-demand)
 * This can be called after a water record is created
 */
export async function checkAndUpdatePetAfterRecord(
  userId: string,
  recordAmount: number
): Promise<{
  petUpdated: boolean;
  moodChanged: boolean;
  newMood?: string;
  healthChanged: boolean;
  newHealth?: number;
}> {
  try {
    const pet = await prisma.pet.findUnique({
      where: { userId },
    });

    if (!pet) {
      return {
        petUpdated: false,
        moodChanged: false,
        healthChanged: false,
      };
    }

    // Always update mood to happy after drinking
    const newMood = 'happy';
    const moodChanged = pet.mood !== newMood;

    // Increase health slightly
    const newHealth = Math.min(100, pet.health + 5);
    const healthChanged = newHealth !== pet.health;

    if (moodChanged || healthChanged) {
      await prisma.pet.update({
        where: { userId },
        data: {
          mood: newMood,
          health: newHealth,
          lastFed: new Date(),
        },
      });
    }

    return {
      petUpdated: moodChanged || healthChanged,
      moodChanged,
      newMood: moodChanged ? newMood : undefined,
      healthChanged,
      newHealth: healthChanged ? newHealth : undefined,
    };
  } catch (error) {
    logger.error({
      message: 'Failed to check and update pet after record',
      userId,
      error: (error as Error).message,
    });
    
    return {
      petUpdated: false,
      moodChanged: false,
      healthChanged: false,
    };
  }
}
