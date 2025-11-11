import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { gamificationService } from '@/lib/services/gamification';

/**
 * @swagger
 * /api/gamification/achievements:
 *   get:
 *     summary: Get user achievements
 *     description: Retrieve all achievements with unlock status for the current user
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: User achievements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 achievements:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       target:
 *                         type: number
 *                       category:
 *                         type: string
 *                       unlocked:
 *                         type: boolean
 *                       unlockedAt:
 *                         type: string
 *                         format: date-time
 *                       progress:
 *                         type: number
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const achievements = await gamificationService.getUserAchievements(userId);

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Get achievements error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
