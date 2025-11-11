import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { restaurantService } from '@/lib/services/restaurant';

const querySchema = z.object({
  days: z.number().int().min(7).max(365).optional().default(30),
});

/**
 * @swagger
 * /api/analytics/inflation/restaurants:
 *   get:
 *     summary: Get restaurant inflation comparison
 *     description: Compare inflation rates across all restaurants (e.g., "McDonald's vs Chick-fil-A inflation")
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
 *         description: Restaurant inflation comparison data
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
    const validated = querySchema.parse({
      days: searchParams.get('days')
        ? parseInt(searchParams.get('days')!)
        : undefined,
    });

    const restaurantInflation = await restaurantService.getRestaurantInflation(
      validated.days
    );

    // Calculate overall statistics
    const inflationRates = restaurantInflation.map((r) => r.inflationRate);
    const averageInflation =
      inflationRates.length > 0
        ? inflationRates.reduce((a, b) => a + b, 0) / inflationRates.length
        : 0;
    const maxInflation =
      inflationRates.length > 0 ? Math.max(...inflationRates) : 0;
    const minInflation =
      inflationRates.length > 0 ? Math.min(...inflationRates) : 0;

    // Find best and worst restaurants
    const bestRestaurant =
      restaurantInflation.length > 0
        ? restaurantInflation.reduce((prev, curr) =>
            curr.inflationRate < prev.inflationRate ? curr : prev
          )
        : null;

    const worstRestaurant =
      restaurantInflation.length > 0
        ? restaurantInflation.reduce((prev, curr) =>
            curr.inflationRate > prev.inflationRate ? curr : prev
          )
        : null;

    return NextResponse.json({
      period: `Last ${validated.days} days`,
      summary: {
        averageInflation,
        maxInflation,
        minInflation,
        restaurantCount: restaurantInflation.length,
        bestRestaurant: bestRestaurant
          ? {
              name: bestRestaurant.restaurantName,
              inflationRate: bestRestaurant.inflationRate,
            }
          : null,
        worstRestaurant: worstRestaurant
          ? {
              name: worstRestaurant.restaurantName,
              inflationRate: worstRestaurant.inflationRate,
            }
          : null,
      },
      restaurants: restaurantInflation,
    });
  } catch (error) {
    console.error('Restaurant inflation error:', error);

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
