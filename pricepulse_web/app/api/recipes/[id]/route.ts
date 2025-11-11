import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Get a specific recipe
 *     description: Retrieve detailed recipe information including ingredients and instructions
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
 *         description: Recipe details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recipe:
 *                   type: object
 *       404:
 *         description: Recipe not found
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

    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: {
        ingredients: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                priceHistory: {
                  orderBy: { recordedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Get recipe error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
