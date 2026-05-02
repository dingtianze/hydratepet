/**
 * Statistics Service
 * Handles weekly/monthly/yearly statistics, goal completion rates, and pet progress data
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { 
  calculateBodyType, 
  calculateColorPalette, 
  EVOLUTION_THRESHOLDS,
  STAGE_NAMES 
} from './petGrowth';

export interface PeriodStats {
  period: string;
  totalAmount: number;
  averageAmount: number;
  goalReachedDays: number;
  totalDays: number;
  streakDays: number;
  recordCount: number;
  completionRate: number;
  bestDay: {
    date: Date;
    amount: number;
  } | null;
}

export interface TrendData {
  labels: string[];
  data: number[];
  goals: number[];
}

export interface DistributionData {
  morning: number;    // 06:00-12:00
  afternoon: number;  // 12:00-18:00
  evening: number;    // 18:00-22:00
  night: number;      // 22:00-06:00
}

export interface PetProgressData {
  currentStage: string;
  currentStageName: string;
  growth: number;
  nextStage: string | null;
  nextStageName: string | null;
  progressToNext: number;
  growthHistory: {
    date: Date;
    growth: number;
    stage: string;
  }[];
}

/**
 * Get statistics for a specific period
 */
export async function getPeriodStats(
  userId: string,
  period: 'today' | 'week' | 'month' | 'year'
): Promise<PeriodStats> {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now);

  switch (period) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
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

  // Find best day
  const bestDay = summaries.length > 0
    ? summaries.reduce((best, current) => 
        current.totalAmount > best.totalAmount ? current : best
      )
    : null;

  return {
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
    bestDay: bestDay ? {
      date: bestDay.date,
      amount: bestDay.totalAmount,
    } : null,
  };
}

/**
 * Get drinking trend data for charts
 */
export async function getTrendData(
  userId: string,
  period: 'week' | 'month' | 'year'
): Promise<TrendData> {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
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
      : period === 'month'
        ? date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
        : date.toLocaleDateString('zh-CN', { month: 'short' });
    
    labels.push(dateStr);
    
    const summary = summaries.find(s => 
      s.date.toISOString().split('T')[0] === date.toISOString().split('T')[0]
    );
    
    data.push(summary?.totalAmount || 0);
    goals.push(goal);
  }

  return {
    labels,
    data,
    goals,
  };
}

/**
 * Get time distribution of drinking
 */
export async function getTimeDistribution(
  userId: string,
  days: number = 30
): Promise<DistributionData> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const records = await prisma.waterRecord.findMany({
    where: {
      userId,
      timestamp: {
        gte: startDate,
      },
    },
  });

  // Categorize by time periods
  const distribution: DistributionData = {
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

  return distribution;
}

/**
 * Get weekly statistics
 */
export async function getWeeklyStats(userId: string): Promise<PeriodStats> {
  return getPeriodStats(userId, 'week');
}

/**
 * Get monthly statistics
 */
export async function getMonthlyStats(userId: string): Promise<PeriodStats> {
  return getPeriodStats(userId, 'month');
}

/**
 * Get yearly statistics
 */
export async function getYearlyStats(userId: string): Promise<PeriodStats> {
  return getPeriodStats(userId, 'year');
}

/**
 * Get goal completion rate
 */
export async function getGoalCompletionRate(
  userId: string,
  days: number = 30
): Promise<{
  totalDays: number;
  completedDays: number;
  completionRate: number;
  averageDailyAmount: number;
  targetAmount: number;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyGoal: true },
  });

  const targetAmount = user?.dailyGoal || 1500;
  const completedDays = summaries.filter(s => s.goalReached).length;
  const totalAmount = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
  const averageDailyAmount = summaries.length > 0 
    ? Math.round(totalAmount / summaries.length) 
    : 0;

  return {
    totalDays: summaries.length,
    completedDays,
    completionRate: summaries.length > 0 
      ? Math.round((completedDays / summaries.length) * 100) 
      : 0,
    averageDailyAmount,
    targetAmount,
  };
}

/**
 * Get pet progress data
 */
export async function getPetProgress(userId: string): Promise<PetProgressData> {
  const pet = await prisma.pet.findUnique({
    where: { userId },
  });

  if (!pet) {
    throw new Error('Pet not found');
  }

  // Get growth history from daily summaries
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      date: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Calculate growth history (approximate based on daily summaries)
  let accumulatedGrowth = Math.max(0, pet.growth - summaries.length * 20); // Rough estimate
  const growthHistory = summaries.map(summary => {
    const dailyGrowth = summary.goalReached ? 20 + summary.streakDays * 3 : 5;
    accumulatedGrowth += dailyGrowth;
    
    // Determine stage at this point
    let stage = 'egg';
    if (accumulatedGrowth >= EVOLUTION_THRESHOLDS.adult) stage = 'adult';
    else if (accumulatedGrowth >= EVOLUTION_THRESHOLDS.teen) stage = 'teen';
    else if (accumulatedGrowth >= EVOLUTION_THRESHOLDS.child) stage = 'child';
    else if (accumulatedGrowth >= EVOLUTION_THRESHOLDS.baby) stage = 'baby';
    
    return {
      date: summary.date,
      growth: accumulatedGrowth,
      stage,
    };
  });

  // Determine next stage
  const stageOrder = ['egg', 'baby', 'child', 'teen', 'adult'];
  const currentStageIndex = stageOrder.indexOf(pet.stage);
  const nextStage = currentStageIndex < stageOrder.length - 1 
    ? stageOrder[currentStageIndex + 1] 
    : null;

  // Calculate progress to next stage
  let progressToNext = 100;
  if (nextStage) {
    const nextThreshold = EVOLUTION_THRESHOLDS[nextStage as keyof typeof EVOLUTION_THRESHOLDS];
    const currentThreshold = EVOLUTION_THRESHOLDS[pet.stage as keyof typeof EVOLUTION_THRESHOLDS];
    const progressInStage = pet.growth - currentThreshold;
    const stageRange = nextThreshold - currentThreshold;
    progressToNext = Math.round((progressInStage / stageRange) * 100);
  }

  return {
    currentStage: pet.stage,
    currentStageName: STAGE_NAMES[pet.stage],
    growth: pet.growth,
    nextStage,
    nextStageName: nextStage ? STAGE_NAMES[nextStage] : null,
    progressToNext,
    growthHistory,
  };
}

/**
 * Get comprehensive stats dashboard data
 */
export async function getStatsDashboard(userId: string): Promise<{
  weekly: PeriodStats;
  monthly: PeriodStats;
  yearly: PeriodStats;
  goalCompletion: {
    totalDays: number;
    completedDays: number;
    completionRate: number;
    averageDailyAmount: number;
    targetAmount: number;
  };
  petProgress: PetProgressData;
  distribution: DistributionData;
  currentStreak: number;
  longestStreak: number;
}> {
  const [weekly, monthly, yearly, goalCompletion, petProgress, distribution] = await Promise.all([
    getWeeklyStats(userId),
    getMonthlyStats(userId),
    getYearlyStats(userId),
    getGoalCompletionRate(userId, 30),
    getPetProgress(userId),
    getTimeDistribution(userId, 30),
  ]);

  // Get current streak
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

  const currentStreak = todaySummary?.goalReached 
    ? todaySummary.streakDays 
    : await getLongestStreak(userId);

  // Get longest streak
  const longestStreakResult = await prisma.dailySummary.aggregate({
    where: { userId },
    _max: {
      streakDays: true,
    },
  });
  const longestStreak = longestStreakResult._max.streakDays || 0;

  return {
    weekly,
    monthly,
    yearly,
    goalCompletion,
    petProgress,
    distribution,
    currentStreak,
    longestStreak,
  };
}

/**
 * Helper: Get longest streak
 */
async function getLongestStreak(userId: string): Promise<number> {
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

  if (yesterdaySummary?.goalReached) {
    return yesterdaySummary.streakDays;
  }

  return 0;
}

/**
 * Get drinking insights
 */
export async function getDrinkingInsights(userId: string): Promise<{
  favoriteTimeOfDay: string;
  consistency: number;
  trend: 'improving' | 'stable' | 'declining';
  recommendation: string;
}> {
  const distribution = await getTimeDistribution(userId, 30);
  const weeklyStats = await getWeeklyStats(userId);
  const monthlyStats = await getMonthlyStats(userId);

  // Determine favorite time of day
  const times = [
    { name: '上午', amount: distribution.morning },
    { name: '下午', amount: distribution.afternoon },
    { name: '晚上', amount: distribution.evening },
    { name: '夜间', amount: distribution.night },
  ];
  const favoriteTime = times.reduce((max, current) => 
    current.amount > max.amount ? current : max
  );

  // Calculate consistency (standard deviation of daily amounts)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
  });

  const amounts = summaries.map(s => s.totalAmount);
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avg, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, Math.round(100 - (stdDev / avg) * 100));

  // Determine trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (monthlyStats.averageAmount > 0) {
    const diff = weeklyStats.averageAmount - monthlyStats.averageAmount;
    if (diff > monthlyStats.averageAmount * 0.1) {
      trend = 'improving';
    } else if (diff < -monthlyStats.averageAmount * 0.1) {
      trend = 'declining';
    }
  }

  // Generate recommendation
  let recommendation = '保持良好的饮水习惯！';
  if (consistency < 50) {
    recommendation = '尝试在固定时间饮水，建立规律的饮水习惯。';
  } else if (distribution.morning < distribution.afternoon * 0.5) {
    recommendation = '上午的饮水量较少，建议上午多喝水。';
  } else if (weeklyStats.completionRate < 50) {
    recommendation = '设定每日提醒，帮助达成饮水目标。';
  }

  return {
    favoriteTimeOfDay: favoriteTime.name,
    consistency,
    trend,
    recommendation,
  };
}
