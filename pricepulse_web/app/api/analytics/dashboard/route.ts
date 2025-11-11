import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { analyticsService } from '@/lib/services/analytics';
import { z } from 'zod';

const querySchema = z.object({
  months: z.number().min(1).max(12).optional().default(3),
});

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get user dashboard analytics
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: months
 *         in: query
 *         schema:
 *           type: number
 *           default: 3
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const months = searchParams.get('months');
    const validated = querySchema.parse({
      months: months ? parseInt(months) : undefined,
    });

    // Get spending analysis
    const spending = await analyticsService.getUserSpendingAnalysis(
      user.id,
      validated.months
    );

    // Get category inflation
    const categoryInflation = await analyticsService.getCategoryInflation(30);

    // Get recent receipts count
    const recentReceipts = await prisma.receipt.count({
      where: {
        userId: user.id,
        transactionDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Get active shopping lists count
    const activeListsCount = await prisma.shoppingList.count({
      where: { userId: user.id },
    });

    // Get active price alerts count
    const activeAlertsCount = await prisma.priceAlert.count({
      where: { userId: user.id, enabled: true },
    });

    return NextResponse.json({
      spending,
      inflation: {
        byCategory: categoryInflation,
      },
      stats: {
        recentReceipts,
        activeListsCount,
        activeAlertsCount,
      },
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
