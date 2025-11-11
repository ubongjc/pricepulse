import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { restaurantService } from '@/lib/services/restaurant';

/**
 * @swagger
 * /api/restaurants/{id}/platforms:
 *   get:
 *     summary: Get restaurant platform availability
 *     description: Get list of delivery platforms where this restaurant is available
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
 *         description: List of available platforms
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

    const platforms = await restaurantService.getRestaurantPlatforms(params.id);

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error('Get restaurant platforms error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
