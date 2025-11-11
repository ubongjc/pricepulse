import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { barcodeScannerService } from '@/lib/services/barcode-scanner';

/**
 * @swagger
 * /api/barcode/{barcode}:
 *   get:
 *     summary: Search for product by barcode
 *     description: Retrieve product information for a specific barcode
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - name: barcode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 barcodeData:
 *                   type: object
 *       404:
 *         description: Barcode not found
 *       401:
 *         description: Unauthorized
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { barcode: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const barcodeData = await barcodeScannerService.searchByBarcode(
      params.barcode
    );

    if (!barcodeData) {
      return NextResponse.json(
        { error: 'Barcode not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ barcodeData });
  } catch (error) {
    console.error('Search barcode error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
