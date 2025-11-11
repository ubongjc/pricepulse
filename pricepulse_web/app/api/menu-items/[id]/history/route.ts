import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { restaurantService } from '@/lib/services/restaurant';

const querySchema = z.object({
  days: z.number().int().min(7).max(365).optional().default(90),
});

/**
 * @swagger
 * /api/menu-items/{id}/history:
 *   get:
 *     summary: Get menu item price history
 *     description: Get historical prices for a menu item
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: days
 *         in: query
 *         schema:
 *           type: number
 *           default: 90
 *     responses:
 *       200:
 *         description: Price history data
 *       401:
 *         description: Unauthorized
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const history = await restaurantService.getMenuItemPriceHistory(
      params.id,
      validated.days
    );

    return NextResponse.json({ history, period: `Last ${validated.days} days` });
  } catch (error) {
    console.error('Menu item price history error:', error);

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
