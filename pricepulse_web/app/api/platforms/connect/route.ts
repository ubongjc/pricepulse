import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { platformIntegrationService } from '@/lib/services/platform-integration';

const connectSchema = z.object({
  platformId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  scope: z.string().optional(),
});

/**
 * @swagger
 * /api/platforms/connect:
 *   post:
 *     summary: Connect delivery platform account
 *     description: Connect user's OAuth account for a delivery platform (enables API-based cart population)
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platformId:
 *                 type: string
 *               accessToken:
 *                 type: string
 *               refreshToken:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               scope:
 *                 type: string
 *     responses:
 *       201:
 *         description: Platform connected successfully
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
    const validated = connectSchema.parse(body);

    const connection = await platformIntegrationService.connectPlatformAccount(
      userId,
      validated.platformId,
      validated.accessToken,
      validated.refreshToken,
      validated.expiresAt ? new Date(validated.expiresAt) : undefined
    );

    return NextResponse.json(
      {
        message: 'Platform connected successfully',
        connectionId: connection.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Connect platform error:', error);

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
 * /api/platforms/connect:
 *   get:
 *     summary: Get connected platforms
 *     description: List all delivery platforms the user has connected via OAuth
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: List of connected platforms
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await platformIntegrationService.getConnectedPlatforms(
      userId
    );

    return NextResponse.json({
      connections: connections.map((c) => ({
        id: c.id,
        platformId: c.platformId,
        platformName: c.platform.name,
        platformSlug: c.platform.slug,
        connectedAt: c.connectedAt,
        lastUsedAt: c.lastUsedAt,
        expiresAt: c.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Get connected platforms error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
