import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { socialService } from '@/lib/services/social';

/**
 * @swagger
 * /api/deals/{id}/verify:
 *   post:
 *     summary: Verify a deal
 *     description: Verify or dispute a deal's validity
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVerified
 *             properties:
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Deal verification recorded
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isVerified } = body;

    if (typeof isVerified !== 'boolean') {
      return NextResponse.json(
        { error: 'isVerified must be a boolean' },
        { status: 400 }
      );
    }

    const result = await socialService.verifyDeal(userId, params.id, isVerified);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verify deal error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
