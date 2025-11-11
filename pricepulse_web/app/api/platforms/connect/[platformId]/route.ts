import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { platformIntegrationService } from '@/lib/services/platform-integration';

/**
 * @swagger
 * /api/platforms/connect/{platformId}:
 *   delete:
 *     summary: Disconnect delivery platform account
 *     description: Remove OAuth connection for a delivery platform
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: platformId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Platform disconnected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Connection not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { platformId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await platformIntegrationService.disconnectPlatformAccount(
      userId,
      params.platformId
    );

    return NextResponse.json({
      message: 'Platform disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect platform error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
