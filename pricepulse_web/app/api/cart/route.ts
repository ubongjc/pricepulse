import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { cartService } from '@/lib/services/cart';

const createCartSchema = z.object({
  platformId: z.string(),
  storeId: z.string().optional(),
  restaurantId: z.string().optional(),
});

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Create a new shopping cart
 *     description: Create a cart for a specific platform and store/restaurant
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platformId:
 *                 type: string
 *               storeId:
 *                 type: string
 *               restaurantId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cart created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createCartSchema.parse(body);

    const cart = await cartService.createCart(
      userId,
      validated.platformId,
      validated.storeId,
      validated.restaurantId
    );

    return NextResponse.json(cart, { status: 201 });
  } catch (error) {
    console.error('Create cart error:', error);

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

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get all active carts for the user
 *     description: Retrieve all active shopping carts
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: List of active carts
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const carts = await cartService.getUserCarts(userId);

    return NextResponse.json({ carts });
  } catch (error) {
    console.error('Get carts error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
