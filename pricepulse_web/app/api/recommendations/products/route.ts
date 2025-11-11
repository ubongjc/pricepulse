import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { smartRecommendationsService } from '@/lib/services/smart-recommendations';

/**
 * @swagger
 * /api/recommendations/products:
 *   get:
 *     summary: Get personalized product recommendations
 *     description: Retrieve AI-powered product recommendations based on user behavior
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Product recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendations:
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
    const limit = parseInt(searchParams.get('limit') || '10');

    const recommendations = await smartRecommendationsService.getRecommendations(
      userId,
      limit
    );

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
