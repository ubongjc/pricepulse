import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { smartRecommendationsService } from '@/lib/services/smart-recommendations';

/**
 * @swagger
 * /api/reminders:
 *   get:
 *     summary: Get pending reminders
 *     description: Retrieve all pending smart reminders for the current user
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Pending reminders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reminders:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reminders = await smartRecommendationsService.getReminders(userId);

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Get reminders error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/reminders:
 *   post:
 *     summary: Create smart reminders
 *     description: Analyze purchase patterns and create smart reminders
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Reminders created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reminders:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reminders = await smartRecommendationsService.createSmartReminders(userId);

    return NextResponse.json({
      reminders,
      count: reminders.length,
      message: `Created ${reminders.length} smart reminders`
    });
  } catch (error) {
    console.error('Create reminders error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
