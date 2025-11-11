import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { smartRecommendationsService } from '@/lib/services/smart-recommendations';

/**
 * @swagger
 * /api/reminders/{id}/dismiss:
 *   post:
 *     summary: Dismiss a reminder
 *     description: Mark a reminder as dismissed
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reminder dismissed
 *       401:
 *         description: Unauthorized
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await smartRecommendationsService.dismissReminder(params.id);

    return NextResponse.json({
      success: true,
      message: 'Reminder dismissed',
    });
  } catch (error) {
    console.error('Dismiss reminder error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
