import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { restaurantService } from '@/lib/services/restaurant';

const querySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radiusKm: z.number().positive().max(100).optional().default(10),
  limit: z.number().int().positive().max(100).optional().default(50),
});

/**
 * @swagger
 * /api/restaurants/nearby:
 *   get:
 *     summary: Find nearby restaurants
 *     description: Find restaurants near a specific location
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: latitude
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: longitude
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *       - name: radiusKm
 *         in: query
 *         schema:
 *           type: number
 *           default: 10
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: List of nearby restaurants
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

    const searchParams = request.nextUrl.searchParams;
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'latitude and longitude are required' },
        { status: 400 }
      );
    }

    const validated = querySchema.parse({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusKm: searchParams.get('radiusKm')
        ? parseFloat(searchParams.get('radiusKm')!)
        : undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : undefined,
    });

    const restaurants = await restaurantService.findRestaurantsByLocation(
      validated.latitude,
      validated.longitude,
      validated.radiusKm,
      validated.limit
    );

    return NextResponse.json({
      restaurants,
      count: restaurants.length,
      center: {
        latitude: validated.latitude,
        longitude: validated.longitude,
      },
      radiusKm: validated.radiusKm,
    });
  } catch (error) {
    console.error('Find nearby restaurants error:', error);

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
