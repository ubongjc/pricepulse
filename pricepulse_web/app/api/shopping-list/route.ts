import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { shoppingService } from '@/lib/services/shopping';
import { prisma } from '@/lib/db';

const createListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  items: z.array(
    z.object({
      productId: z.string().optional(),
      customName: z.string().optional(),
      quantity: z.number().positive(),
      unit: z.string().optional(),
    })
  ).min(1),
});

/**
 * @swagger
 * /api/shopping-list:
 *   post:
 *     summary: Create a new shopping list
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - items
 *     responses:
 *       201:
 *         description: Shopping list created
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request
    const body = await request.json();
    const validated = createListSchema.parse(body);

    // Create shopping list
    const list = await shoppingService.createShoppingList(
      user.id,
      validated.name,
      validated.items
    );

    return NextResponse.json(
      { message: 'Shopping list created', list },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create shopping list error:', error);

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

/**
 * @swagger
 * /api/shopping-list:
 *   get:
 *     summary: Get all shopping lists for current user
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: List of shopping lists
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const lists = await shoppingService.getUserShoppingLists(user.id);

    return NextResponse.json({
      count: lists.length,
      lists,
    });
  } catch (error) {
    console.error('Get shopping lists error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
