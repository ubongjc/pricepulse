import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { gamificationService } from '@/lib/services/gamification';

/**
 * @swagger
 * /api/gamification/stats:
 *   get:
 *     summary: Get user gamification stats
 *     description: Retrieve user's savings streaks, achievements, and overall statistics
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     currentStreak:
 *                       type: number
 *                     longestStreak:
 *                       type: number
 *                     totalSavings:
 *                       type: number
 *                     weeksSaved:
 *                       type: number
 *                     achievementsUnlocked:
 *                       type: number
 *                     totalAchievements:
 *                       type: number
 *                     achievementPercentage:
 *                       type: number
 *                     receiptsScanned:
 *                       type: number
 *                     dealsShared:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await gamificationService.getUserStats(userId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
