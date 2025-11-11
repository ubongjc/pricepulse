import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cartService } from '@/lib/services/cart';

/**
 * @swagger
 * /api/cart/{id}/clear:
 *   post:
 *     summary: Clear cart
 *     description: Remove all items from the cart
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
 *         description: Cart cleared
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

    await cartService.clearCart(params.id);

    return NextResponse.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
