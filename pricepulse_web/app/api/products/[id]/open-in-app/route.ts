import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { platformIntegrationService } from '@/lib/services/platform-integration';

/**
 * @swagger
 * /api/products/{id}/open-in-app:
 *   get:
 *     summary: Get deep link to open product in platform app
 *     description: Generate deep link to open specific product in delivery platform app
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: platformId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deep link URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 platformName:
 *                   type: string
 *       400:
 *         description: Invalid request
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
    const platformId = searchParams.get('platformId');

    if (!platformId) {
      return NextResponse.json(
        { error: 'platformId query parameter is required' },
        { status: 400 }
      );
    }

    const deepLink = await platformIntegrationService.generateItemDeepLink(
      platformId,
      params.id
    );

    if (!deepLink) {
      return NextResponse.json(
        { error: 'Deep linking not supported for this platform' },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: deepLink });
  } catch (error) {
    console.error('Generate deep link error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
