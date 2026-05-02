import { Router } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';

const router = Router();

/**
 * @route GET /api/share/:userId
 * @desc Get public share data for a user
 * @access Public
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    // Get pet
    const pet = await prisma.pet.findUnique({
      where: { userId },
      select: {
        name: true,
        stage: true,
        growth: true,
        mood: true,
      },
    });

    // Get latest stats
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

    const totalRecords = await prisma.waterRecord.count({
      where: { userId },
    });

    const longestStreak = await prisma.dailySummary.aggregate({
      where: { userId },
      _max: { streakDays: true },
    });

    const unlockedBadges = await prisma.userBadge.count({
      where: { userId },
    });

    const unlockedTitles = await prisma.userTitle.count({
      where: { userId },
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          joinedAt: user.createdAt,
        },
        pet: pet
          ? {
              name: pet.name,
              stage: pet.stage,
              growth: pet.growth,
              mood: pet.mood,
            }
          : null,
        stats: {
          todayAmount: todaySummary?.totalAmount || 0,
          todayGoalReached: todaySummary?.goalReached || false,
          totalRecords,
          longestStreak: longestStreak._max.streakDays || 0,
          unlockedBadges,
          unlockedTitles,
        },
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
 * @route POST /api/share/card
 * @desc Generate share card data
 * @access Private
 */
router.post('/card', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const { type = 'daily' } = req.body;

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

    const pet = await prisma.pet.findUnique({
      where: { userId },
      select: { name: true, stage: true },
    });

    const longestStreak = await prisma.dailySummary.aggregate({
      where: { userId },
      _max: { streakDays: true },
    });

    const cardData = {
      type,
      petName: pet?.name || '小水滴',
      petStage: pet?.stage || 'egg',
      todayAmount: todaySummary?.totalAmount || 0,
      goalReached: todaySummary?.goalReached || false,
      streakDays: todaySummary?.streakDays || 0,
      longestStreak: longestStreak._max.streakDays || 0,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${userId}`,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: cardData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as shareRouter };
