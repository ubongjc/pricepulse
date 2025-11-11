import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { gamificationService } from '@/lib/services/gamification';

/**
 * @swagger
 * /api/gamification/leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     description: Retrieve leaderboard for savings, streaks, or achievements
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [savings, streak, achievements]
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Leaderboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'savings' | 'streak' | 'achievements';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!type || !['savings', 'streak', 'achievements'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: savings, streak, or achievements' },
        { status: 400 }
      );
    }

    const leaderboard = await gamificationService.getLeaderboard(type, limit);

    return NextResponse.json({ leaderboard, type });
  } catch (error) {
    console.error('Get leaderboard error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
