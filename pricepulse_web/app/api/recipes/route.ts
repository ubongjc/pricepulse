import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get recipes
 *     description: Retrieve recipes with optional filtering
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: cuisine
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: difficulty
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: featured
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recipes list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recipes:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const cuisine = searchParams.get('cuisine') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    const recipes = await prisma.recipe.findMany({
      where: {
        ...(cuisine && { cuisine }),
        ...(difficulty && { difficulty }),
        ...(featured !== undefined && { featured }),
      },
      include: {
        ingredients: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error('Get recipes error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
