import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { restaurantService } from '@/lib/services/restaurant';

/**
 * @swagger
 * /api/menu-items/{id}/compare:
 *   get:
 *     summary: Compare menu item prices across platforms
 *     description: Compare prices for the same menu item across different delivery platforms
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
 *         description: Platform price comparison
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Menu item not found
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

    const comparison = await restaurantService.compareMenuItemAcrossPlatforms(
      params.id
    );

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Menu item comparison error:', error);

    if (error instanceof Error && error.message === 'Menu item not found') {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
