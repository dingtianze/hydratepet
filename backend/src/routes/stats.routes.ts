import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation schema
const periodSchema = z.enum(['today', 'week', 'month', 'year']);

/**
 * @route GET /api/stats/summary
 * @desc Get statistics summary
 * @access Private
 */
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const period = periodSchema.parse(req.query.period || 'today');
    const userId = req.user!.id;

    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Get daily summaries for the period
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

    // Get total records count
    const records = await prisma.waterRecord.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalAmount = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
    const averageAmount = summaries.length > 0 ? Math.round(totalAmount / summaries.length) : 0;
    const goalReachedDays = summaries.filter(s => s.goalReached).length;

    // Get current streak
    const latestSummary = await prisma.dailySummary.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    const streakDays = latestSummary?.streakDays || 0;

    res.status(200).json({
      success: true,
      data: {
        period,
        totalAmount,
        averageAmount,
        goalReachedDays,
        totalDays: summaries.length,
        streakDays,
        recordCount: records.length,
        completionRate: summaries.length > 0 
          ? Math.round((goalReachedDays / summaries.length) * 100) 
          : 0,
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
 * @route GET /api/stats/trend
 * @desc Get drinking trend
 * @access Private
 */
router.get('/trend', authenticate, async (req, res, next) => {
  try {
    const period = z.enum(['week', 'month']).parse(req.query.period || 'week');
    const userId = req.user!.id;

    const days = period === 'week' ? 7 : 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's daily goal
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyGoal: true },
    });
    const goal = user?.dailyGoal || 1500;

    // Get summaries
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

    // Fill in missing dates
    const labels: string[] = [];
    const data: number[] = [];
    const goals: number[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dateStr = period === 'week' 
        ? date.toLocaleDateString('zh-CN', { weekday: 'short' })
        : date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      
      labels.push(dateStr);
      
      const summary = summaries.find(s => 
        s.date.toISOString().split('T')[0] === date.toISOString().split('T')[0]
      );
      
      data.push(summary?.totalAmount || 0);
      goals.push(goal);
    }

    res.status(200).json({
      success: true,
      data: {
        labels,
        data,
        goals,
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
 * @route GET /api/stats/distribution
 * @desc Get time distribution
 * @access Private
 */
router.get('/distribution', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Get records from last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const records = await prisma.waterRecord.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
        },
      },
    });

    // Categorize by time periods
    const distribution = {
      morning: 0,    // 06:00-12:00
      afternoon: 0,  // 12:00-18:00
      evening: 0,    // 18:00-22:00
      night: 0,      // 22:00-06:00
    };

    records.forEach(record => {
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

    res.status(200).json({
      success: true,
      data: distribution,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as statsRouter };
