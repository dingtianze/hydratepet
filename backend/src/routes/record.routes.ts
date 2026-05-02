import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { authenticate } from '../middleware/auth';
import { getPetStage, EVOLUTION_THRESHOLDS, calculateDailyGrowth } from '../services/petGrowth';
import { 
  createWaterRecord, 
  getWaterRecords, 
  getTodayRecords,
  deleteWaterRecord,
  getDailySummaries,
  getCurrentStreak,
  getLongestStreak,
} from '../services/waterRecord';
import { checkUnlocks } from '../services/unlockEngine';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createRecordSchema = z.object({
  amount: z.number().int().min(1).max(5000),
  timestamp: z.string().datetime().optional(),
  note: z.string().max(200).optional(),
});

/**
 * @route GET /api/records
 * @desc Get water records
 * @access Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { start, end, limit = '100', offset = '0' } = req.query;

    const records = await getWaterRecords(req.user!.id, {
      startDate: start ? new Date(start as string) : undefined,
      endDate: end ? new Date(end as string) : undefined,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.status(200).json({
      success: true,
      data: records,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/records/today
 * @desc Get today's records
 * @access Private
 */
router.get('/today', authenticate, async (req, res, next) => {
  try {
    const result = await getTodayRecords(req.user!.id);

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/records/streak
 * @desc Get current streak
 * @access Private
 */
router.get('/streak', authenticate, async (req, res, next) => {
  try {
    const [currentStreak, longestStreak] = await Promise.all([
      getCurrentStreak(req.user!.id),
      getLongestStreak(req.user!.id),
    ]);

    res.status(200).json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/records/summary
 * @desc Get daily summaries for a date range
 * @access Private
 */
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      throw new ApiError(400, 'BAD_REQUEST', 'Start and end dates are required');
    }

    const summaries = await getDailySummaries(
      req.user!.id,
      new Date(start as string),
      new Date(end as string)
    );

    res.status(200).json({
      success: true,
      data: summaries,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/records
 * @desc Create a new water record
 * @access Private
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createRecordSchema.parse(req.body);

    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    const today = new Date(timestamp);
    today.setHours(0, 0, 0, 0);

    // Create record and update related data in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create water record
      const record = await tx.waterRecord.create({
        data: {
          userId: req.user!.id,
          amount: data.amount,
          timestamp,
          note: data.note,
        },
      });

      // Get or create daily summary
      let summary = await tx.dailySummary.findUnique({
        where: {
          userId_date: {
            userId: req.user!.id,
            date: today,
          },
        },
      });

      // Get user for daily goal
      const user = await tx.user.findUnique({
        where: { id: req.user!.id },
        select: { dailyGoal: true },
      });

      const goal = user?.dailyGoal || 1500;

      if (!summary) {
        // Check yesterday's summary for streak calculation
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdaySummary = await tx.dailySummary.findUnique({
          where: {
            userId_date: {
              userId: req.user!.id,
              date: yesterday,
            },
          },
        });

        const streakDays = yesterdaySummary?.goalReached
          ? yesterdaySummary.streakDays + 1
          : data.amount >= goal ? 1 : 0;

        summary = await tx.dailySummary.create({
          data: {
            userId: req.user!.id,
            date: today,
            totalAmount: data.amount,
            goalReached: data.amount >= goal,
            streakDays,
            recordCount: 1,
          },
        });
      } else {
        // Update existing summary
        const newTotal = summary.totalAmount + data.amount;
        const wasGoalReached = summary.goalReached;
        const nowGoalReached = newTotal >= goal;

        summary = await tx.dailySummary.update({
          where: { id: summary.id },
          data: {
            totalAmount: newTotal,
            goalReached: nowGoalReached,
            recordCount: { increment: 1 },
            // Increment streak if goal first reached today
            streakDays: !wasGoalReached && nowGoalReached && summary.streakDays === 0
              ? 1
              : undefined,
          },
        });
      }

      // Get today's records count for growth calculation
      const todayRecords = await tx.waterRecord.findMany({
        where: {
          userId: req.user!.id,
          timestamp: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      // Calculate growth
      const growthResult = calculateDailyGrowth({
        amount: summary.totalAmount,
        goal,
        streakDays: summary.streakDays,
        recordCount: todayRecords.length,
        hasReachedGoal: summary.goalReached,
      });
      const growth = growthResult.growth;

      // Update pet
      const pet = await tx.pet.findUnique({
        where: { userId: req.user!.id },
      });

      let updatedPet = null;
      let newStage: string | null = null;

      if (pet) {
        const newGrowth = pet.growth + growth;
        const newStageCalculated = getPetStage(newGrowth);
        const stageChanged = newStageCalculated !== pet.stage;

        updatedPet = await tx.pet.update({
          where: { userId: req.user!.id },
          data: {
            growth: newGrowth,
            stage: newStageCalculated,
            lastFed: new Date(),
            mood: 'happy',
          },
        });

        if (stageChanged) {
          newStage = newStageCalculated;
        }
      }

      return {
        record,
        petGrowth: growth,
        totalGrowth: updatedPet?.growth || 0,
        goalReached: !summary.goalReached && summary.totalAmount >= goal,
        newStage,
      };
    });

    logger.info({
      message: 'Water record created',
      userId: req.user!.id,
      amount: data.amount,
    });

    // Check for badge/title unlocks (outside transaction to avoid lock contention)
    let unlocks = { newBadges: [] as any[], newTitles: [] as any[] };
    try {
      unlocks = await checkUnlocks(req.user!.id);
    } catch (unlockError) {
      logger.error({
        message: 'Unlock check failed',
        userId: req.user!.id,
        error: (unlockError as Error).message,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        record: {
          id: result.record.id,
          amount: result.record.amount,
          timestamp: result.record.timestamp,
          recordType: result.record.recordType,
          note: result.record.note,
        },
        petGrowth: result.petGrowth,
        totalGrowth: result.totalGrowth,
        goalReached: result.goalReached,
        newStage: result.newStage,
        newBadges: unlocks.newBadges,
        newTitles: unlocks.newTitles,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/records/:id
 * @desc Delete a record (only allowed for today's records)
 * @access Private
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await prisma.waterRecord.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!record) {
      throw new ApiError(404, 'NOT_FOUND', 'Record not found');
    }

    // Only allow deleting today's records
    const recordDate = new Date(record.timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    recordDate.setHours(0, 0, 0, 0);

    if (recordDate.getTime() !== today.getTime()) {
      throw new ApiError(403, 'FORBIDDEN', 'Can only delete today\'s records');
    }

    await prisma.waterRecord.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      data: { message: 'Record deleted successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as recordRouter };
