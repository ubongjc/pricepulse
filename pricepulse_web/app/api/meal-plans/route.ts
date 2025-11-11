import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * @swagger
 * /api/meal-plans:
 *   get:
 *     summary: Get user's meal plans
 *     description: Retrieve all meal plans for the current user
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: active
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Meal plans list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mealPlans:
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
    const activeOnly = searchParams.get('active') === 'true';

    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        recipes: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
          orderBy: { scheduledDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ mealPlans });
  } catch (error) {
    console.error('Get meal plans error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/meal-plans:
 *   post:
 *     summary: Create a meal plan
 *     description: Create a new meal plan for the user
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
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               budgetTarget:
 *                 type: number
 *     responses:
 *       201:
 *         description: Meal plan created
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
    const { name, startDate, endDate, budgetTarget } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'name, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budgetTarget,
      },
    });

    return NextResponse.json({ mealPlan }, { status: 201 });
  } catch (error) {
    console.error('Create meal plan error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
