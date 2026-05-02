/**
 * Water Record Service
 * Handles water record creation, queries, daily summaries, and streak counting
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { calculateDailyGrowth, updatePetGrowth } from './petGrowth';

export interface CreateRecordInput {
  userId: string;
  amount: number;
  timestamp?: Date;
  note?: string;
  recordType?: string;
}

export interface RecordResult {
  record: {
    id: string;
    amount: number;
    timestamp: Date;
    recordType: string;
    note: string | null;
  };
  summary: {
    totalAmount: number;
    goal: number;
    remaining: number;
    percentage: number;
    recordCount: number;
    goalReached: boolean;
    streakDays: number;
  };
  petUpdate: {
    growth: number;
    totalGrowth: number;
    stageChanged: boolean;
    newStage: string | null;
  } | null;
}

/**
 * Get or create daily summary for a specific date
 */
export async function getOrCreateDailySummary(
  userId: string,
  date: Date
): Promise<any> {
  // Normalize date to midnight
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  let summary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId,
        date: normalizedDate,
      },
    },
  });

  if (!summary) {
    // Check yesterday's summary for streak calculation
    const yesterday = new Date(normalizedDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdaySummary = await prisma.dailySummary.findUnique({
      where: {
        userId_date: {
          userId,
          date: yesterday,
        },
      },
    });

    const initialStreak = yesterdaySummary?.streakDays || 0;

    summary = await prisma.dailySummary.create({
      data: {
        userId,
        date: normalizedDate,
        totalAmount: 0,
        goalReached: false,
        streakDays: initialStreak,
        recordCount: 0,
      },
    });
  }

  return summary;
}

/**
 * Calculate streak days after a record is added
 */
export async function calculateStreakDays(
  userId: string,
  date: Date,
  goalReached: boolean
): Promise<number> {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  // Get yesterday's summary
  const yesterday = new Date(normalizedDate);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdaySummary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId,
        date: yesterday,
      },
    },
  });

  // If goal was reached today
  if (goalReached) {
    // If yesterday's goal was also reached, continue streak
    if (yesterdaySummary?.goalReached) {
      return yesterdaySummary.streakDays + 1;
    }
    // Start new streak
    return 1;
  }

  // If goal not reached, keep yesterday's streak (it will break tomorrow if no goal)
  return yesterdaySummary?.streakDays || 0;
}

/**
 * Update streak for all future days after a record modification
 * This is called when a record is deleted or modified
 */
export async function recalculateStreaks(userId: string, fromDate: Date): Promise<void> {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  // Get all summaries from the date onwards
  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      date: {
        gte: from,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  let currentStreak = 0;

  for (let i = 0; i < summaries.length; i++) {
    const summary = summaries[i];

    if (summary.goalReached) {
      currentStreak++;
    } else {
      currentStreak = 0;
    }

    // Only update if streak changed
    if (summary.streakDays !== currentStreak) {
      await prisma.dailySummary.update({
        where: { id: summary.id },
        data: { streakDays: currentStreak },
      });
    }
  }
}

/**
 * Create a new water record with all related updates
 */
export async function createWaterRecord(input: CreateRecordInput): Promise<RecordResult> {
  const { userId, amount, timestamp = new Date(), note, recordType = 'quick' } = input;

  // Get user's daily goal
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyGoal: true },
  });

  const goal = user?.dailyGoal || 1500;

  return await prisma.$transaction(async (tx) => {
    // Create the record
    const record = await tx.waterRecord.create({
      data: {
        userId,
        amount,
        timestamp,
        note: note || null,
        recordType,
      },
    });

    // Get or create daily summary
    const recordDate = new Date(timestamp);
    recordDate.setHours(0, 0, 0, 0);

    let summary = await tx.dailySummary.findUnique({
      where: {
        userId_date: {
          userId,
          date: recordDate,
        },
      },
    });

    // Get today's records count
    const tomorrow = new Date(recordDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecords = await tx.waterRecord.findMany({
      where: {
        userId,
        timestamp: {
          gte: recordDate,
          lt: tomorrow,
        },
      },
    });

    const newTotalAmount = (summary?.totalAmount || 0) + amount;
    const newGoalReached = newTotalAmount >= goal;
    const wasGoalReached = summary?.goalReached || false;

    // Calculate streak
    let streakDays = 0;
    if (newGoalReached && !wasGoalReached) {
      const yesterday = new Date(recordDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdaySummary = await tx.dailySummary.findUnique({
        where: {
          userId_date: {
            userId,
            date: yesterday,
          },
        },
      });
      streakDays = (yesterdaySummary?.goalReached ? yesterdaySummary.streakDays : 0) + 1;
    } else {
      streakDays = summary?.streakDays || 0;
    }

    if (summary) {
      summary = await tx.dailySummary.update({
        where: { id: summary.id },
        data: {
          totalAmount: newTotalAmount,
          goalReached: newGoalReached,
          recordCount: todayRecords.length,
          streakDays: newGoalReached && !wasGoalReached ? streakDays : summary.streakDays,
        },
      });
    } else {
      summary = await tx.dailySummary.create({
        data: {
          userId,
          date: recordDate,
          totalAmount: newTotalAmount,
          goalReached: newGoalReached,
          recordCount: todayRecords.length,
          streakDays,
        },
      });
    }

    // Calculate growth
    const growthResult = calculateDailyGrowth({
      amount: summary.totalAmount,
      goal,
      streakDays: summary.streakDays,
      recordCount: todayRecords.length,
      hasReachedGoal: summary.goalReached,
    });

    // Update pet growth
    let petUpdate = null;
    try {
      const pet = await tx.pet.findUnique({
        where: { userId },
      });

      if (pet) {
        const previousStage = pet.stage;
        const newGrowth = pet.growth + growthResult.growth;
        const { getPetStage } = await import('./petGrowth');
        const newStage = getPetStage(newGrowth);
        const stageChanged = newStage !== previousStage;

        await tx.pet.update({
          where: { userId },
          data: {
            growth: newGrowth,
            stage: newStage,
            lastFed: new Date(),
            mood: 'happy',
            health: Math.min(100, pet.health + 5),
          },
        });

        petUpdate = {
          growth: growthResult.growth,
          totalGrowth: newGrowth,
          stageChanged,
          newStage: stageChanged ? newStage : null,
        };
      }
    } catch (error) {
      logger.error({
        message: 'Failed to update pet growth',
        userId,
        error: (error as Error).message,
      });
    }

    const remaining = Math.max(0, goal - summary.totalAmount);
    const percentage = Math.min(100, Math.round((summary.totalAmount / goal) * 100));

    logger.info({
      message: 'Water record created',
      userId,
      amount,
      recordId: record.id,
      totalAmount: summary.totalAmount,
      goalReached: summary.goalReached,
    });

    return {
      record: {
        id: record.id,
        amount: record.amount,
        timestamp: record.timestamp,
        recordType: record.recordType,
        note: record.note,
      },
      summary: {
        totalAmount: summary.totalAmount,
        goal,
        remaining,
        percentage,
        recordCount: summary.recordCount,
        goalReached: summary.goalReached,
        streakDays: summary.streakDays,
      },
      petUpdate,
    };
  });
}

/**
 * Get water records for a date range
 */
export async function getWaterRecords(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<any[]> {
  const { startDate, endDate, limit = 100, offset = 0 } = options;

  const where: any = { userId };

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const records = await prisma.waterRecord.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
  });

  return records.map((r) => ({
    id: r.id,
    amount: r.amount,
    timestamp: r.timestamp,
    recordType: r.recordType,
    note: r.note,
  }));
}

/**
 * Get today's records and summary
 */
export async function getTodayRecords(userId: string): Promise<{
  records: any[];
  summary: {
    totalAmount: number;
    goal: number;
    remaining: number;
    percentage: number;
    recordCount: number;
    goalReached: boolean;
  };
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get records
  const records = await prisma.waterRecord.findMany({
    where: {
      userId,
      timestamp: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  // Get user goal
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyGoal: true },
  });

  const goal = user?.dailyGoal || 1500;
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const remaining = Math.max(0, goal - totalAmount);
  const percentage = Math.min(100, Math.round((totalAmount / goal) * 100));

  return {
    records: records.map((r) => ({
      id: r.id,
      amount: r.amount,
      timestamp: r.timestamp,
      recordType: r.recordType,
      note: r.note,
    })),
    summary: {
      totalAmount,
      goal,
      remaining,
      percentage,
      recordCount: records.length,
      goalReached: totalAmount >= goal,
    },
  };
}

/**
 * Delete a water record
 */
export async function deleteWaterRecord(
  userId: string,
  recordId: string
): Promise<boolean> {
  return await prisma.$transaction(async (tx) => {
    const record = await tx.waterRecord.findFirst({
      where: {
        id: recordId,
        userId,
      },
    });

    if (!record) {
      throw new Error('Record not found');
    }

    const recordDate = new Date(record.timestamp);
    recordDate.setHours(0, 0, 0, 0);

    // Delete the record
    await tx.waterRecord.delete({
      where: { id: recordId },
    });

    // Update daily summary
    const summary = await tx.dailySummary.findUnique({
      where: {
        userId_date: {
          userId,
          date: recordDate,
        },
      },
    });

    if (summary) {
      const newTotal = Math.max(0, summary.totalAmount - record.amount);
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { dailyGoal: true },
      });
      const goal = user?.dailyGoal || 1500;
      const newGoalReached = newTotal >= goal;

      await tx.dailySummary.update({
        where: { id: summary.id },
        data: {
          totalAmount: newTotal,
          goalReached: newGoalReached,
          recordCount: Math.max(0, summary.recordCount - 1),
        },
      });

      // Recalculate streaks from this date
      await recalculateStreaks(userId, recordDate);
    }

    logger.info({
      message: 'Water record deleted',
      userId,
      recordId,
      amount: record.amount,
    });

    return true;
  });
}

/**
 * Get daily summaries for a date range
 */
export async function getDailySummaries(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  return summaries.map((s) => ({
    date: s.date,
    totalAmount: s.totalAmount,
    goalReached: s.goalReached,
    streakDays: s.streakDays,
    recordCount: s.recordCount,
  }));
}

/**
 * Get current streak
 */
export async function getCurrentStreak(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today's goal is reached
  const todaySummary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  // If goal reached today, return today's streak
  if (todaySummary?.goalReached) {
    return todaySummary.streakDays;
  }

  // Otherwise check yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdaySummary = await prisma.dailySummary.findUnique({
    where: {
      userId_date: {
        userId,
        date: yesterday,
      },
    },
  });

  if (yesterdaySummary?.goalReached) {
    return yesterdaySummary.streakDays;
  }

  return 0;
}

/**
 * Get longest streak
 */
export async function getLongestStreak(userId: string): Promise<number> {
  const result = await prisma.dailySummary.aggregate({
    where: { userId },
    _max: {
      streakDays: true,
    },
  });

  return result._max.streakDays || 0;
}
