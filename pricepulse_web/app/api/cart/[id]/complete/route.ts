import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cartService } from '@/lib/services/cart';

/**
 * @swagger
 * /api/cart/{id}/complete:
 *   post:
 *     summary: Complete cart
 *     description: Mark cart as completed (order placed)
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
 *         description: Cart completed
 *       401:
 *         description: Unauthorized
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

    const cart = await cartService.completeCart(params.id);

    return NextResponse.json(cart);
  } catch (error) {
    console.error('Complete cart error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
