import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { smartRecommendationsService } from '@/lib/services/smart-recommendations';

/**
 * @swagger
 * /api/recommendations/stores:
 *   get:
 *     summary: Get personalized store recommendations
 *     description: Retrieve store recommendations based on user preferences and savings
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: postalCode
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Store recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stores:
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

    const searchParams = request.nextUrl.searchParams;
    const postalCode = searchParams.get('postalCode') || undefined;

    const stores = await smartRecommendationsService.getStoreRecommendations(
      userId,
      postalCode
    );

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Get store recommendations error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
