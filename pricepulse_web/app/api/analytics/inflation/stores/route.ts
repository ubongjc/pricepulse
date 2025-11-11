import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { analyticsService } from '@/lib/services/analytics';

const querySchema = z.object({
  days: z.number().min(7).max(365).optional().default(30),
});

/**
 * @swagger
 * /api/analytics/inflation/stores:
 *   get:
 *     summary: Get inflation comparison across stores
 *     description: Compare inflation rates for all stores
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         schema:
 *           type: number
 *           default: 30
 *     responses:
 *       200:
 *         description: Store inflation comparison data
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get('days');
    const validated = querySchema.parse({
      days: days ? parseInt(days) : undefined,
    });

    // Get store inflation comparison
    const storeInflation = await analyticsService.getStoreInflation(validated.days);

    // Calculate overall statistics
    const inflationRates = storeInflation.map((s) => s.inflationRate);
    const averageInflation = inflationRates.length > 0
      ? inflationRates.reduce((a, b) => a + b, 0) / inflationRates.length
      : 0;
    const maxInflation = inflationRates.length > 0
      ? Math.max(...inflationRates)
      : 0;
    const minInflation = inflationRates.length > 0
      ? Math.min(...inflationRates)
      : 0;

    return NextResponse.json({
      period: `Last ${validated.days} days`,
      summary: {
        averageInflation,
        maxInflation,
        minInflation,
        storeCount: storeInflation.length,
      },
      stores: storeInflation,
    });
  } catch (error) {
    console.error('Store inflation error:', error);

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
