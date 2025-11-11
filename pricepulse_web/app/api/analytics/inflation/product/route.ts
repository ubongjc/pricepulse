import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { analyticsService } from '@/lib/services/analytics';

const querySchema = z.object({
  productId: z.string(),
  days: z.number().min(7).max(365).optional().default(30),
});

/**
 * @swagger
 * /api/analytics/inflation/product:
 *   get:
 *     summary: Compare product prices and inflation across stores
 *     description: Get store-by-store comparison for a specific product (e.g., "bananas at Walmart vs Loblaws")
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: productId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *       - name: days
 *         in: query
 *         schema:
 *           type: number
 *           default: 30
 *     responses:
 *       200:
 *         description: Product price comparison across stores
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const days = searchParams.get('days');

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const validated = querySchema.parse({
      productId,
      days: days ? parseInt(days) : undefined,
    });

    // Get product comparison across stores
    const comparison = await analyticsService.compareStoresForProduct(
      validated.productId,
      validated.days
    );

    // Get price history trend
    const priceTrend = await analyticsService.getProductInflation(
      validated.productId,
      validated.days
    );

    // Calculate best and worst stores
    const bestStore = comparison.stores.length > 0
      ? comparison.stores.reduce((prev, curr) =>
          curr.currentPrice < prev.currentPrice ? curr : prev
        )
      : null;

    const worstStore = comparison.stores.length > 0
      ? comparison.stores.reduce((prev, curr) =>
          curr.currentPrice > prev.currentPrice ? curr : prev
        )
      : null;

    const potentialSavings = bestStore && worstStore
      ? worstStore.currentPrice - bestStore.currentPrice
      : 0;

    return NextResponse.json({
      product: comparison.productName,
      period: `Last ${validated.days} days`,
      summary: {
        bestStore: bestStore?.storeName,
        bestPrice: bestStore?.currentPrice,
        worstStore: worstStore?.storeName,
        worstPrice: worstStore?.currentPrice,
        potentialSavings,
        storeCount: comparison.stores.length,
      },
      stores: comparison.stores,
      priceTrend,
    });
  } catch (error) {
    console.error('Product inflation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
