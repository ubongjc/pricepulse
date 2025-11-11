import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { restaurantService } from '@/lib/services/restaurant';

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     summary: Get restaurant details
 *     description: Get detailed information about a restaurant including menu items
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
 *         description: Restaurant details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Restaurant not found
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

    const restaurant = await restaurantService.getRestaurantDetails(params.id);

    return NextResponse.json(restaurant);
  } catch (error) {
    console.error('Get restaurant details error:', error);

    if (error instanceof Error && error.message === 'Restaurant not found') {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
