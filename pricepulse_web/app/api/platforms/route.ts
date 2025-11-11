import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  type: z.enum(['grocery', 'restaurant', 'both']).optional(),
});

/**
 * @swagger
 * /api/platforms:
 *   get:
 *     summary: Get all delivery platforms
 *     description: Get list of all available delivery platforms (Instacart, Uber Eats, etc.)
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [grocery, restaurant, both]
 *     responses:
 *       200:
 *         description: List of platforms
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
    const validated = querySchema.parse({
      type: searchParams.get('type') || undefined,
    });

    const where: any = { active: true };

    if (validated.type) {
      where.type = validated.type;
    }

    const platforms = await prisma.deliveryPlatform.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      platforms: platforms.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        logo: p.logo,
        website: p.website,
        appScheme: p.appScheme,
        iosAppId: p.iosAppId,
        androidPackage: p.androidPackage,
        deliveryFeeMin: p.deliveryFeeMin ? Number(p.deliveryFeeMin) : null,
        deliveryFeeMax: p.deliveryFeeMax ? Number(p.deliveryFeeMax) : null,
        serviceFeePercent: p.serviceFeePercent
          ? Number(p.serviceFeePercent)
          : null,
        minimumOrder: p.minimumOrder ? Number(p.minimumOrder) : null,
      })),
    });
  } catch (error) {
    console.error('Get platforms error:', error);

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
