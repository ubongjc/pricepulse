import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { gamificationService } from '@/lib/services/gamification';

/**
 * @swagger
 * /api/gamification/record-savings:
 *   post:
 *     summary: Record user savings
 *     description: Record savings amount, update streaks, and check for new achievements
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount saved in dollars
 *     responses:
 *       200:
 *         description: Savings recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 newAchievements:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    await gamificationService.recordSavings(userId, amount);

    return NextResponse.json({
      success: true,
      message: `Recorded $${amount.toFixed(2)} in savings`,
    });
  } catch (error) {
    console.error('Record savings error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
