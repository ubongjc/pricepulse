import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cartService } from '@/lib/services/cart';

/**
 * @swagger
 * /api/cart/{id}:
 *   get:
 *     summary: Get cart summary
 *     description: Get detailed summary of a specific cart
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
 *         description: Cart summary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
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

    const summary = await cartService.getCartSummary(params.id);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Get cart summary error:', error);

    if (error instanceof Error && error.message === 'Cart not found') {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/cart/{id}:
 *   delete:
 *     summary: Cancel cart
 *     description: Cancel a shopping cart
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
 *         description: Cart cancelled
 *       401:
 *         description: Unauthorized
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await cartService.cancelCart(params.id);

    return NextResponse.json({ message: 'Cart cancelled' });
  } catch (error) {
    console.error('Cancel cart error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
