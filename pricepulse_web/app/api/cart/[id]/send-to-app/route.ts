import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { platformIntegrationService } from '@/lib/services/platform-integration';

/**
 * @swagger
 * /api/cart/{id}/send-to-app:
 *   post:
 *     summary: Send cart to platform app
 *     description: Open the delivery platform app with cart items (uses deep linking, API, or fallback methods)
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
 *         description: App launch info with URL and instructions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 method:
 *                   type: string
 *                   enum: [deep_link, api, web_url, clipboard]
 *                 url:
 *                   type: string
 *                 instructions:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       quantity:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await platformIntegrationService.sendCartToPlatform(
      params.id,
      userId
    );

    if (!result.success && result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Cart not found' ? 404 : 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Send to app error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
