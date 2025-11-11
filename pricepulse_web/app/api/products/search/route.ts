import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { shoppingService } from '@/lib/services/shopping';

const searchSchema = z.object({
  q: z.string().min(2).max(100),
  limit: z.number().min(1).max(50).optional(),
});

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search for products
 *     description: Search products by name, brand, or UPC with autocomplete
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: List of matching products
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = searchParams.get('limit');

    const validated = searchSchema.parse({
      q: query,
      limit: limit ? parseInt(limit) : undefined,
    });

    // Search products
    const products = await shoppingService.searchProducts(
      validated.q,
      validated.limit
    );

    return NextResponse.json({
      query: validated.q,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Product search error:', error);

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
