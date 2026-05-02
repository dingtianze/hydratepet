import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  weight: z.number().int().min(20).max(300).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  workHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  }).optional(),
  dailyGoal: z.number().int().min(500).max(5000).optional(),
  avatarUrl: z.string().url().optional(),
});

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            stage: true,
            growth: true,
            mood: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    // Calculate streaks
    const summaries = await prisma.dailySummary.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 1,
    });

    const currentStreak = summaries[0]?.streakDays || 0;

    // Get longest streak
    const longestStreakResult = await prisma.dailySummary.aggregate({
      where: { userId: user.id },
      _max: { streakDays: true },
    });
    const longestStreak = longestStreakResult._max.streakDays || 0;

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        weight: user.weight,
        gender: user.gender,
        workStart: user.workStart,
        workEnd: user.workEnd,
        dailyGoal: user.dailyGoal,
        currentStreak,
        longestStreak,
        pet: user.pet,
        createdAt: user.createdAt,
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
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const updateData: any = {};
    if (data.nickname) updateData.nickname = data.nickname;
    if (data.weight) updateData.weight = data.weight;
    if (data.gender) updateData.gender = data.gender;
    if (data.dailyGoal) updateData.dailyGoal = data.dailyGoal;
    if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;
    if (data.workHours) {
      updateData.workStart = data.workHours.start;
      updateData.workEnd = data.workHours.end;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        weight: true,
        gender: true,
        workStart: true,
        workEnd: true,
        dailyGoal: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
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
 * @route DELETE /api/users/account
 * @desc Delete user account
 * @access Private
 */
router.delete('/account', authenticate, async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.user!.id },
    });

    res.status(200).json({
      success: true,
      data: { message: 'Account deleted successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRouter };
