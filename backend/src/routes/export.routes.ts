import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../utils/ApiError';

const router = Router();

/**
 * @route GET /api/export/data
 * @desc Export all user data as JSON
 * @access Private
 */
router.get('/data', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const [user, pet, records, summaries, badges, titles, reminderConfig] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          authType: true,
          phone: true,
          nickname: true,
          avatarUrl: true,
          weight: true,
          gender: true,
          workStart: true,
          workEnd: true,
          dailyGoal: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.pet.findUnique({
        where: { userId },
        select: {
          id: true,
          name: true,
          stage: true,
          growth: true,
          bodyType: true,
          colorPalette: true,
          accessories: true,
          mood: true,
          health: true,
          createdAt: true,
        },
      }),
      prisma.waterRecord.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.dailySummary.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badgeDef: true },
      }),
      prisma.userTitle.findMany({
        where: { userId },
        include: { titleDef: true },
      }),
      prisma.reminderConfig.findUnique({
        where: { userId },
      }),
    ]);

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: user || {},
      pet: pet || null,
      waterRecords: records,
      dailySummaries: summaries,
      badges: badges.map((b) => ({
        unlockedAt: b.unlockedAt,
        badge: {
          key: b.badgeDef.key,
          name: b.badgeDef.name,
          description: b.badgeDef.description,
          iconUrl: b.badgeDef.iconUrl,
          rarity: b.badgeDef.rarity,
        },
      })),
      titles: titles.map((t) => ({
        unlockedAt: t.unlockedAt,
        isActive: t.isActive,
        title: {
          key: t.titleDef.key,
          name: t.titleDef.name,
          description: t.titleDef.description,
          icon: t.titleDef.icon,
          category: t.titleDef.category,
        },
      })),
      reminderConfig: reminderConfig || null,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="hydratepet-export-${new Date().toISOString().split('T')[0]}.json"`);

    res.status(200).json({
      success: true,
      data: exportData,
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
 * @route POST /api/export/import
 * @desc Import user data
 * @access Private
 */
router.post('/import', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { data } = req.body;

    if (!data || !data.version) {
      throw new ApiError(400, 'INVALID_DATA', 'Invalid export data format');
    }

    // Validate basic structure
    if (!data.user || !Array.isArray(data.waterRecords)) {
      throw new ApiError(400, 'INVALID_DATA', 'Missing required data fields');
    }

    await prisma.$transaction(async (tx) => {
      // Update user settings (don't overwrite auth info)
      if (data.user.dailyGoal) {
        await tx.user.update({
          where: { id: userId },
          data: {
            dailyGoal: data.user.dailyGoal,
            weight: data.user.weight,
            workStart: data.user.workStart,
            workEnd: data.user.workEnd,
            timezone: data.user.timezone,
          },
        });
      }

      // Import water records (skip duplicates by timestamp)
      for (const record of data.waterRecords) {
        const existing = await tx.waterRecord.findFirst({
          where: {
            userId,
            timestamp: new Date(record.timestamp),
            amount: record.amount,
          },
        });

        if (!existing) {
          await tx.waterRecord.create({
            data: {
              userId,
              amount: record.amount,
              timestamp: new Date(record.timestamp),
              recordType: record.recordType || 'quick',
              note: record.note,
            },
          });
        }
      }

      // Import daily summaries
      if (Array.isArray(data.dailySummaries)) {
        for (const summary of data.dailySummaries) {
          await tx.dailySummary.upsert({
            where: {
              userId_date: {
                userId,
                date: new Date(summary.date),
              },
            },
            update: {
              totalAmount: summary.totalAmount,
              goalReached: summary.goalReached,
              streakDays: summary.streakDays,
              recordCount: summary.recordCount,
            },
            create: {
              userId,
              date: new Date(summary.date),
              totalAmount: summary.totalAmount,
              goalReached: summary.goalReached,
              streakDays: summary.streakDays,
              recordCount: summary.recordCount,
            },
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Data imported successfully',
        recordsImported: data.waterRecords.length,
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

export { router as exportRouter };
