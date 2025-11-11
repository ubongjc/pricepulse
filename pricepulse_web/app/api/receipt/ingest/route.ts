import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Validation schemas
const lineItemSchema = z.object({
  productName: z.string().min(1),
  upc: z.string().optional(),
  quantity: z.number().positive(),
  unitSize: z.string().optional(),
  unitSizeNormalized: z.number().optional(),
  unitType: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  category: z.string().optional(),
  brand: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const receiptIngestSchema = z.object({
  storeName: z.string().min(1),
  storeLocation: z.string().optional(),
  postalCode: z.string().optional(),
  transactionDate: z.string().datetime(),
  totalAmount: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().optional(),
  receiptImageUrl: z.string().url().optional(),
  receiptImageKey: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  metadata: z.record(z.any()).optional(),
});

/**
 * @swagger
 * /api/receipt/ingest:
 *   post:
 *     summary: Ingest a new receipt
 *     description: Creates a new receipt with line items for the authenticated user
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeName
 *               - transactionDate
 *               - totalAmount
 *               - lineItems
 *             properties:
 *               storeName:
 *                 type: string
 *               storeLocation:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               transactionDate:
 *                 type: string
 *                 format: date-time
 *               totalAmount:
 *                 type: number
 *               taxAmount:
 *                 type: number
 *               receiptImageUrl:
 *                 type: string
 *               receiptImageKey:
 *                 type: string
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Receipt created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = receiptIngestSchema.parse(body);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      // Create user if they don't exist (should be handled by webhook, but fallback)
      const clerkUser = await (await import('@clerk/nextjs/server')).clerkClient();
      const clerkUserData = await clerkUser.users.getUser(clerkUserId);

      user = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email: clerkUserData.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUserData.firstName || undefined,
          lastName: clerkUserData.lastName || undefined,
        },
      });
    }

    // Create receipt with line items in a transaction
    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        storeName: validatedData.storeName,
        storeLocation: validatedData.storeLocation,
        postalCode: validatedData.postalCode,
        transactionDate: new Date(validatedData.transactionDate),
        totalAmount: validatedData.totalAmount,
        taxAmount: validatedData.taxAmount,
        receiptImageUrl: validatedData.receiptImageUrl,
        receiptImageKey: validatedData.receiptImageKey,
        metadata: validatedData.metadata,
        lineItems: {
          create: validatedData.lineItems.map((item) => ({
            productName: item.productName,
            upc: item.upc,
            quantity: item.quantity,
            unitSize: item.unitSize,
            unitSizeNormalized: item.unitSizeNormalized,
            unitType: item.unitType,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            category: item.category,
            brand: item.brand,
            metadata: item.metadata,
          })),
        },
      },
      include: {
        lineItems: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Receipt ingested successfully',
        receipt: {
          id: receipt.id,
          storeName: receipt.storeName,
          transactionDate: receipt.transactionDate,
          totalAmount: receipt.totalAmount,
          lineItemCount: receipt.lineItems.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Receipt ingest error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
