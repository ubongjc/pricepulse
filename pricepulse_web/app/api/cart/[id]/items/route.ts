import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { cartService } from '@/lib/services/cart';

const addItemSchema = z.object({
  productId: z.string().optional(),
  menuItemId: z.string().optional(),
  quantity: z.number().int().positive(),
  customizations: z.any().optional(),
});

/**
 * @swagger
 * /api/cart/{id}/items:
 *   post:
 *     summary: Add item to cart
 *     description: Add a product or menu item to the cart
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               menuItemId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               customizations:
 *                 type: object
 *     responses:
 *       201:
 *         description: Item added to cart
 *       400:
 *         description: Invalid request
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

    const body = await request.json();
    const validated = addItemSchema.parse(body);

    if (!validated.productId && !validated.menuItemId) {
      return NextResponse.json(
        { error: 'Either productId or menuItemId must be provided' },
        { status: 400 }
      );
    }

    const cartItem = await cartService.addItem(params.id, {
      productId: validated.productId,
      menuItemId: validated.menuItemId,
      quantity: validated.quantity,
      customizations: validated.customizations,
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error('Add item error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
