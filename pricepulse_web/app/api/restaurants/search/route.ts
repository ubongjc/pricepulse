import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { restaurantService } from '@/lib/services/restaurant';

const querySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  cuisine: z.string().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
});

/**
 * @swagger
 * /api/restaurants/search:
 *   get:
 *     summary: Search for restaurants
 *     description: Search restaurants by name, category, or cuisine
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *       - name: cuisine
 *         in: query
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: List of restaurants
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
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      cuisine: searchParams.get('cuisine') || undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
    });

    const restaurants = await restaurantService.searchRestaurants(
      validated.q || '',
      validated.category,
      validated.cuisine,
      validated.limit
    );

    return NextResponse.json({ restaurants, count: restaurants.length });
  } catch (error) {
    console.error('Restaurant search error:', error);

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
