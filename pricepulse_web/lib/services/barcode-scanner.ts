import { prisma } from '@/lib/db';
import { productImageService } from './product-image';

/**
 * Barcode Scanner Service
 * Handles barcode scanning, product lookup, and database management
 */
export class BarcodeScannerService {
  private readonly OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2';

  /**
   * Scan a barcode and retrieve product information
   */
  async scanBarcode(
    barcode: string,
    source: 'user_scan' | 'manual' = 'user_scan'
  ) {
    // Check if barcode already exists in database
    const existingBarcode = await prisma.barcodeData.findUnique({
      where: { barcode },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });

    if (existingBarcode?.product) {
      return {
        success: true,
        product: existingBarcode.product,
        barcodeData: existingBarcode,
        isNew: false,
      };
    }

    // Fetch from Open Food Facts
    const productData = await this.fetchFromOpenFoodFacts(barcode);

    if (!productData) {
      // Create unlinked barcode entry
      const barcodeData = await prisma.barcodeData.create({
        data: {
          barcode,
          upcType: this.detectBarcodeType(barcode),
          source,
          verified: false,
        },
      });

      return {
        success: false,
        message: 'Product not found',
        barcodeData,
        isNew: true,
      };
    }

    // Create or update product
    const product = await this.createOrUpdateProduct(productData);

    // Link barcode to product
    const barcodeData = await prisma.barcodeData.upsert({
      where: { barcode },
      create: {
        barcode,
        productId: product.id,
        upcType: this.detectBarcodeType(barcode),
        source,
        verified: true,
      },
      update: {
        productId: product.id,
        verified: true,
      },
    });

    // Fetch and store product images
    await productImageService.fetchProductImages(
      product.id,
      product.name,
      barcode
    );

    return {
      success: true,
      product,
      barcodeData,
      isNew: true,
    };
  }

  /**
   * Fetch product data from Open Food Facts API
   */
  private async fetchFromOpenFoodFacts(barcode: string) {
    try {
      const response = await fetch(
        `${this.OPEN_FOOD_FACTS_API}/product/${barcode}.json`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.status === 0 || !data.product) {
        return null;
      }

      const product = data.product;

      return {
        barcode,
        name: product.product_name || product.product_name_en || 'Unknown Product',
        brand: product.brands || null,
        category: product.categories?.split(',')[0]?.trim() || null,
        description: product.generic_name || product.generic_name_en || null,
        imageUrl: product.image_url || product.image_front_url || null,
        unitSize: product.quantity || null,
        organic: product.labels?.toLowerCase().includes('organic') || false,
        glutenFree: product.allergens_tags?.includes('en:gluten-free') || false,
        vegan: product.labels?.toLowerCase().includes('vegan') || false,
        metadata: {
          ingredients: product.ingredients_text,
          nutriments: product.nutriments,
          nutriscore: product.nutriscore_grade,
          ecoscore: product.ecoscore_grade,
          nova_group: product.nova_group,
        },
      };
    } catch (error) {
      console.error('Open Food Facts API error:', error);
      return null;
    }
  }

  /**
   * Create or update product in database
   */
  private async createOrUpdateProduct(productData: any) {
    const existingProduct = await prisma.product.findUnique({
      where: { upc: productData.barcode },
    });

    if (existingProduct) {
      // Update existing product with new data
      return prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: productData.name,
          brand: productData.brand,
          category: productData.category,
          description: productData.description,
          imageUrl: productData.imageUrl,
          unitSize: productData.unitSize,
          organic: productData.organic,
          glutenFree: productData.glutenFree,
          vegan: productData.vegan,
          metadata: productData.metadata,
        },
      });
    }

    // Create new product
    return prisma.product.create({
      data: {
        upc: productData.barcode,
        name: productData.name,
        brand: productData.brand,
        category: productData.category,
        description: productData.description,
        imageUrl: productData.imageUrl,
        unitSize: productData.unitSize,
        organic: productData.organic,
        glutenFree: productData.glutenFree,
        vegan: productData.vegan,
        metadata: productData.metadata,
      },
    });
  }

  /**
   * Detect barcode type based on length and format
   */
  private detectBarcodeType(barcode: string): string {
    const length = barcode.length;

    if (length === 12) {
      return 'UPC-A';
    } else if (length === 13) {
      return 'EAN-13';
    } else if (length === 8) {
      return 'EAN-8';
    } else if (length === 14) {
      return 'ITF-14';
    }

    return 'UNKNOWN';
  }

  /**
   * Batch scan multiple barcodes
   */
  async batchScan(barcodes: string[], source: 'user_scan' | 'manual' = 'user_scan') {
    const results = await Promise.all(
      barcodes.map((barcode) => this.scanBarcode(barcode, source))
    );

    return {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Search for product by barcode
   */
  async searchByBarcode(barcode: string) {
    const barcodeData = await prisma.barcodeData.findUnique({
      where: { barcode },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            priceHistory: {
              orderBy: { recordedAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    return barcodeData;
  }

  /**
   * Link barcode to existing product
   */
  async linkBarcodeToProduct(barcode: string, productId: string) {
    return prisma.barcodeData.upsert({
      where: { barcode },
      create: {
        barcode,
        productId,
        upcType: this.detectBarcodeType(barcode),
        source: 'manual',
        verified: true,
      },
      update: {
        productId,
        verified: true,
      },
    });
  }

  /**
   * Get barcode statistics
   */
  async getStatistics() {
    const totalBarcodes = await prisma.barcodeData.count();
    const linkedBarcodes = await prisma.barcodeData.count({
      where: { productId: { not: null } },
    });
    const verifiedBarcodes = await prisma.barcodeData.count({
      where: { verified: true },
    });

    const barcodesByType = await prisma.barcodeData.groupBy({
      by: ['upcType'],
      _count: true,
    });

    const barcodesBySource = await prisma.barcodeData.groupBy({
      by: ['source'],
      _count: true,
    });

    return {
      total: totalBarcodes,
      linked: linkedBarcodes,
      unlinked: totalBarcodes - linkedBarcodes,
      verified: verifiedBarcodes,
      byType: barcodesByType,
      bySource: barcodesBySource,
    };
  }
}

export const barcodeScannerService = new BarcodeScannerService();
