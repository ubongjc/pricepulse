import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { restaurantService } from '@/lib/services/restaurant';

const querySchema = z.object({
  q: z.string().optional(),
  restaurantId: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
});

/**
 * @swagger
 * /api/menu-items/search:
 *   get:
 *     summary: Search for menu items
 *     description: Search menu items across restaurants
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         schema:
 *           type: string
 *       - name: restaurantId
 *         in: query
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: List of menu items
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
      restaurantId: searchParams.get('restaurantId') || undefined,
      category: searchParams.get('category') || undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
    });

    const menuItems = await restaurantService.searchMenuItems(
      validated.q || '',
      validated.restaurantId,
      validated.category,
      validated.limit
    );

    return NextResponse.json({ menuItems, count: menuItems.length });
  } catch (error) {
    console.error('Menu item search error:', error);

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
