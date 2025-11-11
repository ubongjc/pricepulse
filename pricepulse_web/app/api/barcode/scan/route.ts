import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { barcodeScannerService } from '@/lib/services/barcode-scanner';

/**
 * @swagger
 * /api/barcode/scan:
 *   post:
 *     summary: Scan a barcode
 *     description: Scan a barcode and retrieve product information from Open Food Facts
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barcode
 *             properties:
 *               barcode:
 *                 type: string
 *                 description: The barcode number to scan
 *               source:
 *                 type: string
 *                 enum: [user_scan, manual]
 *                 default: user_scan
 *     responses:
 *       200:
 *         description: Barcode scanned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 product:
 *                   type: object
 *                 barcodeData:
 *                   type: object
 *                 isNew:
 *                   type: boolean
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
    const { barcode, source = 'user_scan' } = body;

    if (!barcode || typeof barcode !== 'string') {
      return NextResponse.json(
        { error: 'Barcode is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await barcodeScannerService.scanBarcode(barcode, source);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Barcode scan error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
