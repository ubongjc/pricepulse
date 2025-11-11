import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Achievement definitions
 */
export const ACHIEVEMENTS = {
  // Savings achievements
  PENNY_PINCHER: {
    id: 'penny_pincher',
    name: 'Penny Pincher',
    description: 'Save $10 in one week',
    icon: '💰',
    target: 10,
    category: 'savings',
  },
  BARGAIN_HUNTER: {
    id: 'bargain_hunter',
    name: 'Bargain Hunter',
    description: 'Save $50 in one month',
    icon: '🎯',
    target: 50,
    category: 'savings',
  },
  SAVINGS_MASTER: {
    id: 'savings_master',
    name: 'Savings Master',
    description: 'Save $500 total',
    icon: '👑',
    target: 500,
    category: 'savings',
  },

  // Streak achievements
  HOT_STREAK: {
    id: 'hot_streak',
    name: 'Hot Streak',
    description: 'Save money 7 weeks in a row',
    icon: '🔥',
    target: 7,
    category: 'streak',
  },
  UNSTOPPABLE: {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Save money 12 weeks in a row',
    icon: '⚡',
    target: 12,
    category: 'streak',
  },

  // Smart shopping achievements
  SMART_SHOPPER: {
    id: 'smart_shopper',
    name: 'Smart Shopper',
    description: 'Use 3 different stores in one month',
    icon: '🧠',
    target: 3,
    category: 'shopping',
  },
  DEAL_FINDER: {
    id: 'deal_finder',
    name: 'Deal Finder',
    description: 'Share 5 deals with community',
    icon: '🔍',
    target: 5,
    category: 'social',
  },

  // Scanning achievements
  SCANNER_PRO: {
    id: 'scanner_pro',
    name: 'Scanner Pro',
    description: 'Scan 100 receipts',
    icon: '📱',
    target: 100,
    category: 'scanning',
  },
  RECEIPT_MASTER: {
    id: 'receipt_master',
    name: 'Receipt Master',
    description: 'Scan 500 receipts',
    icon: '🎨',
    target: 500,
    category: 'scanning',
  },

  // Prediction achievements
  PRICE_PROPHET: {
    id: 'price_prophet',
    name: 'Price Prophet',
    description: 'Predict 5 price drops correctly',
    icon: '🔮',
    target: 5,
    category: 'prediction',
  },

  // Early adopter
  EARLY_ADOPTER: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Use new features first',
    icon: '🚀',
    target: 1,
    category: 'special',
  },
} as const;

/**
 * Gamification Service
 * Manages achievements, streaks, and user rewards
 */
export class GamificationService {
  /**
   * Record savings and update achievements
   */
  async recordSavings(userId: string, amount: number): Promise<void> {
    // Update savings streak
    await this.updateSavingsStreak(userId, amount);

    // Check and unlock achievements
    await this.checkAchievements(userId);
  }

  /**
   * Update user's savings streak
   */
  private async updateSavingsStreak(
    userId: string,
    amount: number
  ): Promise<void> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    let streak = await prisma.savingsStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      // Create new streak
      streak = await prisma.savingsStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastSaveDate: now,
          totalSavings: amount,
          weeksSaved: 1,
        },
      });
      return;
    }

    // Check if last save was in previous week
    const lastSaveWeekStart = new Date(streak.lastSaveDate!);
    lastSaveWeekStart.setHours(0, 0, 0, 0);
    lastSaveWeekStart.setDate(lastSaveWeekStart.getDate() - lastSaveWeekStart.getDay());

    const weeksDiff = Math.floor(
      (startOfWeek.getTime() - lastSaveWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    let newCurrentStreak = streak.currentStreak;
    let newWeeksSaved = streak.weeksSaved;

    if (weeksDiff === 1) {
      // Continuing streak
      newCurrentStreak++;
      newWeeksSaved++;
    } else if (weeksDiff > 1) {
      // Streak broken
      newCurrentStreak = 1;
      newWeeksSaved++;
    }
    // If weeksDiff === 0, same week, don't increment streak

    const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);
    const newTotalSavings = Number(streak.totalSavings) + amount;

    await prisma.savingsStreak.update({
      where: { userId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastSaveDate: now,
        totalSavings: newTotalSavings,
        weeksSaved: newWeeksSaved,
      },
    });
  }

  /**
   * Check and unlock achievements for user
   */
  async checkAchievements(userId: string): Promise<string[]> {
    const unlockedAchievements: string[] = [];

    // Get user data
    const streak = await prisma.savingsStreak.findUnique({
      where: { userId },
    });

    if (!streak) return [];

    const receiptCount = await prisma.receipt.count({
      where: { userId },
    });

    const dealsShared = await prisma.deal.count({
      where: { userId },
    });

    // Check savings achievements
    if (Number(streak.totalSavings) >= 10) {
      await this.unlockAchievement(userId, ACHIEVEMENTS.PENNY_PINCHER.id);
      unlockedAchievements.push(ACHIEVEMENTS.PENNY_PINCHER.id);
    }

    if (Number(streak.totalSavings) >= 50) {
      await this.unlockAchievement(userId, ACHIEVEMENTS.BARGAIN_HUNTER.id);
      unlockedAchievements.push(ACHIEVEMENTS.BARGAIN_HUNTER.id);
    }

    if (Number(streak.totalSavings) >= 500) {
      await this.unlockAchievement(userId, ACHIEVEMENTS.SAVINGS_MASTER.id);
      unlockedAchievements.push(ACHIEVEMENTS.SAVINGS_MASTER.id);
    }

    // Check streak achievements
    if (streak.currentStreak >= 7) {
      await this.unlockAchievement(userId, ACHIEVEMENTS.HOT_STREAK.id);
      unlockedAchievements.push(ACHIEVEMENTS.HOT_STREAK.id);
    }

    if (streak.currentStreak >= 12) {
      await this.unlockAchievement(userId, ACHIEVEMENTS.UNSTOPPABLE.id);
      unlockedAchievements.push(ACHIEVEMENTS.UNSTOPPABLE.id);
    }

    // Check scanning achievements
    if (receiptCount >= 100) {
      await this.unlockAchievement(userId, ACHIEVEMENTS.SCANNER_PRO.id);
      unlockedAchievements.push(ACHIEVEMENTS.SCANNER_PRO.id);
    }

    if (receiptCount >= 500) {
      await this.unlockAchievement(userId, ACHIEVEMENTS.RECEIPT_MASTER.id);
      unlockedAchievements.push(ACHIEVEMENTS.RECEIPT_MASTER.id);
    }

    // Check social achievements
    if (dealsShared >= 5) {
      await this.unlockAchievement(userId, ACHIEVEMENTS.DEAL_FINDER.id);
      unlockedAchievements.push(ACHIEVEMENTS.DEAL_FINDER.id);
    }

    return unlockedAchievements;
  }

  /**
   * Unlock achievement for user
   */
  private async unlockAchievement(
    userId: string,
    achievementId: string
  ): Promise<void> {
    try {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
          isCompleted: true,
          progress: 100,
        },
      });
    } catch (error) {
      // Achievement already unlocked (unique constraint)
      // Silently ignore
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string) {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
    });

    const achievementMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua])
    );

    return Object.values(ACHIEVEMENTS).map((achievement) => ({
      ...achievement,
      unlocked: achievementMap.has(achievement.id),
      unlockedAt: achievementMap.get(achievement.id)?.unlockedAt,
      progress: achievementMap.get(achievement.id)?.progress || 0,
    }));
  }

  /**
   * Get user stats
   */
  async getUserStats(userId: string) {
    const streak = await prisma.savingsStreak.findUnique({
      where: { userId },
    });

    const achievements = await prisma.userAchievement.count({
      where: { userId, isCompleted: true },
    });

    const receiptsScanned = await prisma.receipt.count({
      where: { userId },
    });

    const dealsShared = await prisma.deal.count({
      where: { userId },
    });

    const totalAchievements = Object.keys(ACHIEVEMENTS).length;

    return {
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      totalSavings: Number(streak?.totalSavings || 0),
      weeksSaved: streak?.weeksSaved || 0,
      achievementsUnlocked: achievements,
      totalAchievements,
      achievementPercentage: Math.round(
        (achievements / totalAchievements) * 100
      ),
      receiptsScanned,
      dealsShared,
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    type: 'savings' | 'streak' | 'achievements',
    limit: number = 10
  ) {
    if (type === 'savings') {
      return prisma.savingsStreak.findMany({
        take: limit,
        orderBy: { totalSavings: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    if (type === 'streak') {
      return prisma.savingsStreak.findMany({
        take: limit,
        orderBy: { currentStreak: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    // Achievements leaderboard
    const topUsers = await prisma.userAchievement.groupBy({
      by: ['userId'],
      where: { isCompleted: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const userIds = topUsers.map((u) => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return topUsers.map((u) => ({
      user: userMap.get(u.userId),
      achievementCount: u._count.id,
    }));
  }

  /**
   * Award early adopter achievement
   */
  async awardEarlyAdopter(userId: string): Promise<void> {
    await this.unlockAchievement(userId, ACHIEVEMENTS.EARLY_ADOPTER.id);
  }
}

export const gamificationService = new GamificationService();
