/**
 * Unlock Engine Service
 * Checks and awards badges/titles based on user activity
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface UnlockResult {
  newBadges: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    iconUrl: string | null;
    rarity: string;
  }>;
  newTitles: Array<{
    id: string;
    key: string;
    name: string;
    description: string | null;
    icon: string | null;
    category: string;
  }>;
}

/**
 * Check and unlock badges/titles for a user after an activity
 */
export async function checkUnlocks(userId: string): Promise<UnlockResult> {
  const result: UnlockResult = {
    newBadges: [],
    newTitles: [],
  };

  // Get user's current unlocks
  const [userBadges, userTitles] = await Promise.all([
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    }),
    prisma.userTitle.findMany({
      where: { userId },
      select: { titleId: true },
    }),
  ]);

  const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
  const unlockedTitleIds = new Set(userTitles.map((ut) => ut.titleId));

  // Get all definitions
  const [allBadges, allTitles] = await Promise.all([
    prisma.badgeDef.findMany(),
    prisma.titleDef.findMany(),
  ]);

  // Check badges
  for (const badge of allBadges) {
    if (unlockedBadgeIds.has(badge.id)) continue;
    const shouldUnlock = await checkBadgeCondition(userId, badge.conditionType, badge.conditionValue);
    if (shouldUnlock) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      });
      result.newBadges.push({
        id: badge.id,
        key: badge.key,
        name: badge.name,
        description: badge.description || '',
        iconUrl: badge.iconUrl,
        rarity: badge.rarity,
      });
      logger.info({ message: 'Badge unlocked', userId, badge: badge.key });
    }
  }

  // Check titles
  for (const title of allTitles) {
    if (unlockedTitleIds.has(title.id)) continue;
    const shouldUnlock = await checkTitleCondition(userId, title.conditionType, title.conditionValue);
    if (shouldUnlock) {
      await prisma.userTitle.create({
        data: {
          userId,
          titleId: title.id,
        },
      });
      result.newTitles.push({
        id: title.id,
        key: title.key,
        name: title.name,
        description: title.description,
        icon: title.icon,
        category: title.category,
      });
      logger.info({ message: 'Title unlocked', userId, title: title.key });
    }
  }

  return result;
}

/**
 * Check if a badge condition is met
 */
async function checkBadgeCondition(
  userId: string,
  conditionType: string,
  conditionValue: string
): Promise<boolean> {
  try {
    const value = JSON.parse(conditionValue);

    switch (conditionType) {
      case 'total_records': {
        const count = await prisma.waterRecord.count({ where: { userId } });
        return count >= (value.min || 1);
      }

      case 'streak_days': {
        const latest = await prisma.dailySummary.findFirst({
          where: { userId },
          orderBy: { date: 'desc' },
        });
        return (latest?.streakDays || 0) >= (value.min || 1);
      }

      case 'total_amount': {
        const records = await prisma.waterRecord.findMany({ where: { userId } });
        const total = records.reduce((sum, r) => sum + r.amount, 0);
        return total >= (value.min || 1000);
      }

      default:
        return false;
    }
  } catch (error) {
    logger.error({ message: 'Badge condition check failed', userId, conditionType, error: (error as Error).message });
    return false;
  }
}

/**
 * Check if a title condition is met
 */
async function checkTitleCondition(
  userId: string,
  conditionType: string,
  conditionValue: string
): Promise<boolean> {
  try {
    const value = JSON.parse(conditionValue);

    switch (conditionType) {
      case 'consecutive_goal': {
        const latest = await prisma.dailySummary.findFirst({
          where: { userId },
          orderBy: { date: 'desc' },
        });
        return (latest?.streakDays || 0) >= (value.days || 1);
      }

      case 'low_intake_streak': {
        // Check if user had consecutive days with low intake
        const summaries = await prisma.dailySummary.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: value.days || 3,
        });
        if (summaries.length < (value.days || 3)) return false;
        return summaries.every((s) => s.totalAmount <= (value.maxAmount || 500));
      }

      case 'exact_amount': {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { dailyGoal: true },
        });
        if (!user) return false;
        const records = await prisma.waterRecord.findMany({
          where: { userId },
        });
        return records.some((r) => r.amount === user.dailyGoal);
      }

      case 'night_drinking': {
        const days = value.days || 3;
        const afterHour = value.afterHour || 22;
        const records = await prisma.waterRecord.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          take: 100,
        });
        // Group by date
        const dateMap = new Map<string, boolean>();
        for (const r of records) {
          const hour = new Date(r.timestamp).getHours();
          if (hour >= afterHour || hour < 6) {
            const dateStr = r.timestamp.toISOString().split('T')[0];
            dateMap.set(dateStr, true);
          }
        }
        return dateMap.size >= days;
      }

      case 'early_completion': {
        const daysNeeded = value.days || 7;
        const percentage = value.percentage || 50;
        const summaries = await prisma.dailySummary.findMany({
          where: { userId, goalReached: true },
          orderBy: { date: 'desc' },
          take: daysNeeded * 2,
        });
        let earlyCount = 0;
        for (const summary of summaries) {
          // Get morning records for this day
          const dateStart = new Date(summary.date);
          dateStart.setHours(0, 0, 0, 0);
          const noon = new Date(dateStart);
          noon.setHours(12, 0, 0, 0);
          const morningAmount = await prisma.waterRecord.aggregate({
            where: {
              userId,
              timestamp: {
                gte: dateStart,
                lt: noon,
              },
            },
            _sum: { amount: true },
          });
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { dailyGoal: true },
          });
          const goal = user?.dailyGoal || 1500;
          if ((morningAmount._sum.amount || 0) >= goal * (percentage / 100)) {
            earlyCount++;
          }
        }
        return earlyCount >= daysNeeded;
      }

      default:
        return false;
    }
  } catch (error) {
    logger.error({ message: 'Title condition check failed', userId, conditionType, error: (error as Error).message });
    return false;
  }
}

/**
 * Manually recheck all unlocks for a user (useful for debugging)
 */
export async function forceRecheckUnlocks(userId: string): Promise<UnlockResult> {
  logger.info({ message: 'Force rechecking unlocks', userId });
  return checkUnlocks(userId);
}
