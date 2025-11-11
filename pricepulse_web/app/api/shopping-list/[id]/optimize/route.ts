import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { shoppingService } from '@/lib/services/shopping';
import { prisma } from '@/lib/db';

const optimizeSchema = z.object({
  strategy: z.enum(['cheapest_per_item', 'cheapest_single_store', 'balanced']),
});

/**
 * @swagger
 * /api/shopping-list/{id}/optimize:
 *   post:
 *     summary: Optimize shopping list to find best stores
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               strategy:
 *                 type: string
 *                 enum: [cheapest_per_item, cheapest_single_store, balanced]
 *     responses:
 *       200:
 *         description: Optimization results
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: List not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify list ownership
    const list = await prisma.shoppingList.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!list) {
      return NextResponse.json(
        { error: 'Shopping list not found' },
        { status: 404 }
      );
    }

    if (list.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse request
    const body = await request.json();
    const validated = optimizeSchema.parse(body);

    // Optimize list
    const result = await shoppingService.optimizeShoppingList(
      params.id,
      validated.strategy
    );

    // Mark list as optimized
    await prisma.shoppingList.update({
      where: { id: params.id },
      data: { optimized: true },
    });

    return NextResponse.json({
      message: 'Shopping list optimized',
      strategy: validated.strategy,
      result,
    });
  } catch (error) {
    console.error('Optimize shopping list error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
