import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { socialService } from '@/lib/services/social';

/**
 * @swagger
 * /api/deals:
 *   get:
 *     summary: Get community deals feed
 *     description: Retrieve active deals from the community
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: storeId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: productId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: offset
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Deals feed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deals:
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
    const deals = await socialService.getDealsFeed({
      userId: searchParams.get('userId') || undefined,
      storeId: searchParams.get('storeId') || undefined,
      productId: searchParams.get('productId') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    });

    return NextResponse.json({ deals });
  } catch (error) {
    console.error('Get deals feed error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/deals:
 *   post:
 *     summary: Create a new deal
 *     description: Share a deal with the community
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - storeId
 *               - price
 *             properties:
 *               productId:
 *                 type: string
 *               storeId:
 *                 type: string
 *               price:
 *                 type: number
 *               regularPrice:
 *                 type: number
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Deal created
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
    const {
      productId,
      storeId,
      price,
      regularPrice,
      description,
      imageUrl,
      expiresAt,
    } = body;

    if (!productId || !storeId || typeof price !== 'number') {
      return NextResponse.json(
        { error: 'productId, storeId, and price are required' },
        { status: 400 }
      );
    }

    const deal = await socialService.createDeal(userId, {
      productId,
      storeId,
      price,
      regularPrice,
      description,
      imageUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Create deal error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
