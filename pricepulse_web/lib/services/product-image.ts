import { prisma } from '@/lib/db';
import sharp from 'sharp';
import axios from 'axios';

interface ImageSource {
  url: string;
  source: string;
  width?: number;
  height?: number;
}

/**
 * Product Image Service
 * Fetches, optimizes, and manages product images from multiple sources
 */
export class ProductImageService {
  /**
   * Fetch and store product images from multiple sources
   */
  async fetchProductImages(
    productId: string,
    productName: string,
    upc?: string
  ): Promise<void> {
    const sources: ImageSource[] = [];

    // Try Open Food Facts API first (700K+ products)
    if (upc) {
      const offImage = await this.fetchFromOpenFoodFacts(upc);
      if (offImage) sources.push(offImage);
    }

    // Try Instacart API (if integrated)
    const instacartImage = await this.fetchFromInstacart(productName);
    if (instacartImage) sources.push(instacartImage);

    // Try generic product image search (fallback)
    const searchImage = await this.fetchFromImageSearch(productName);
    if (searchImage) sources.push(searchImage);

    // Process and store images
    for (const [index, imageSource] of sources.entries()) {
      await this.processAndStoreImage(
        productId,
        imageSource,
        index === 0 // First image is primary
      );
    }

    // If no images found, create category-based placeholder
    if (sources.length === 0) {
      await this.createPlaceholderImage(productId, productName);
    }
  }

  /**
   * Fetch from Open Food Facts
   */
  private async fetchFromOpenFoodFacts(
    upc: string
  ): Promise<ImageSource | null> {
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v2/product/${upc}.json`
      );

      if (response.data.status === 1 && response.data.product.image_url) {
        return {
          url: response.data.product.image_url,
          source: 'open_food_facts',
          width: response.data.product.image_front_url ? 400 : undefined,
          height: response.data.product.image_front_url ? 400 : undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Open Food Facts fetch error:', error);
      return null;
    }
  }

  /**
   * Fetch from Instacart (requires API key)
   */
  private async fetchFromInstacart(
    productName: string
  ): Promise<ImageSource | null> {
    // TODO: Implement Instacart API integration
    // Requires Instacart Partner API credentials
    return null;
  }

  /**
   * Fetch from generic image search
   */
  private async fetchFromImageSearch(
    productName: string
  ): Promise<ImageSource | null> {
    // TODO: Implement Unsplash or Pexels API for generic food images
    // For now, return null and use placeholder
    return null;
  }

  /**
   * Process image: download, optimize, create multiple sizes
   */
  private async processAndStoreImage(
    productId: string,
    imageSource: ImageSource,
    isPrimary: boolean
  ): Promise<void> {
    try {
      // Download original image
      const response = await axios.get(imageSource.url, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      const imageBuffer = Buffer.from(response.data);

      // Get dominant color for placeholder
      const dominantColor = await this.extractDominantColor(imageBuffer);

      // Create multiple sizes
      const sizes = await this.createImageSizes(imageBuffer);

      // Upload to CDN (Cloudflare R2)
      const cdnUrls = await this.uploadToCDN(productId, sizes);

      // Store in database
      await prisma.productImage.create({
        data: {
          productId,
          url: cdnUrls.detail, // Default to detail size
          thumbnailUrl: cdnUrls.thumbnail,
          cardUrl: cdnUrls.card,
          detailUrl: cdnUrls.detail,
          fullUrl: cdnUrls.full,
          source: imageSource.source,
          width: sizes.detail.width,
          height: sizes.detail.height,
          dominantColor,
          isPrimary,
          verified: imageSource.source === 'open_food_facts',
        },
      });
    } catch (error) {
      console.error(`Failed to process image from ${imageSource.source}:`, error);
      // Continue with next image source instead of throwing
    }
  }

  /**
   * Create multiple image sizes
   */
  private async createImageSizes(imageBuffer: Buffer): Promise<{
    thumbnail: { buffer: Buffer; width: number; height: number };
    card: { buffer: Buffer; width: number; height: number };
    detail: { buffer: Buffer; width: number; height: number };
    full: { buffer: Buffer; width: number; height: number };
  }> {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    return {
      thumbnail: {
        buffer: await image
          .clone()
          .resize(100, 100, { fit: 'cover' })
          .webp({ quality: 80 })
          .toBuffer(),
        width: 100,
        height: 100,
      },
      card: {
        buffer: await image
          .clone()
          .resize(300, 300, { fit: 'cover' })
          .webp({ quality: 85 })
          .toBuffer(),
        width: 300,
        height: 300,
      },
      detail: {
        buffer: await image
          .clone()
          .resize(600, 600, { fit: 'inside' })
          .webp({ quality: 90 })
          .toBuffer(),
        width: 600,
        height: 600,
      },
      full: {
        buffer: await image.clone().webp({ quality: 95 }).toBuffer(),
        width: metadata.width || 800,
        height: metadata.height || 800,
      },
    };
  }

  /**
   * Extract dominant color from image
   */
  private async extractDominantColor(imageBuffer: Buffer): Promise<string> {
    try {
      const { data } = await sharp(imageBuffer)
        .resize(1, 1, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const [r, g, b] = data;
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (error) {
      console.error('Color extraction error:', error);
      return '#E5E7EB'; // Default gray
    }
  }

  /**
   * Upload images to CDN (Cloudflare R2)
   */
  private async uploadToCDN(
    productId: string,
    sizes: any
  ): Promise<{
    thumbnail: string;
    card: string;
    detail: string;
    full: string;
  }> {
    // TODO: Implement actual Cloudflare R2 upload
    // This currently returns placeholder URLs. For production:
    // 1. Set up Cloudflare R2 bucket and configure credentials in .env
    // 2. Use @aws-sdk/client-s3 with R2 endpoint to upload image buffers
    // 3. Return actual public CDN URLs instead of placeholders

    const baseUrl = process.env.NEXT_PUBLIC_CDN_URL || '/images/products';

    return {
      thumbnail: `${baseUrl}/${productId}/thumbnail.webp`,
      card: `${baseUrl}/${productId}/card.webp`,
      detail: `${baseUrl}/${productId}/detail.webp`,
      full: `${baseUrl}/${productId}/full.webp`,
    };
  }

  /**
   * Create category-based placeholder image
   */
  private async createPlaceholderImage(
    productId: string,
    productName: string
  ): Promise<void> {
    const category = this.detectCategory(productName);
    const placeholderUrl = this.getCategoryPlaceholder(category);
    const color = this.getCategoryColor(category);

    await prisma.productImage.create({
      data: {
        productId,
        url: placeholderUrl,
        thumbnailUrl: placeholderUrl,
        cardUrl: placeholderUrl,
        detailUrl: placeholderUrl,
        fullUrl: placeholderUrl,
        source: 'placeholder',
        width: 300,
        height: 300,
        dominantColor: color,
        isPrimary: true,
        verified: false,
      },
    });
  }

  /**
   * Detect product category from name
   */
  private detectCategory(productName: string): string {
    const name = productName.toLowerCase();

    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt'))
      return 'dairy';
    if (name.includes('bread') || name.includes('bagel') || name.includes('roll'))
      return 'bakery';
    if (name.includes('apple') || name.includes('banana') || name.includes('orange'))
      return 'fruit';
    if (name.includes('carrot') || name.includes('lettuce') || name.includes('broccoli'))
      return 'vegetable';
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork'))
      return 'meat';
    if (name.includes('shampoo') || name.includes('soap') || name.includes('detergent'))
      return 'household';

    return 'grocery';
  }

  /**
   * Get category placeholder image URL
   */
  private getCategoryPlaceholder(category: string): string {
    return `/placeholders/${category}.svg`;
  }

  /**
   * Get category color
   */
  private getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      dairy: '#F3E5F5',      // Soft purple
      bakery: '#FFF3E0',     // Warm orange
      fruit: '#FCE4EC',      // Pink
      vegetable: '#E8F5E9',  // Fresh green
      meat: '#FFEBEE',       // Red
      household: '#E3F2FD',  // Blue
      grocery: '#F5F5F5',    // Gray
    };

    return colors[category] || colors.grocery;
  }

  /**
   * Get product images
   */
  async getProductImages(productId: string) {
    return prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Get primary image
   */
  async getPrimaryImage(productId: string) {
    return prisma.productImage.findFirst({
      where: { productId, isPrimary: true },
    });
  }

  /**
   * Upload user image
   */
  async uploadUserImage(
    productId: string,
    imageBuffer: Buffer,
    userId: string
  ): Promise<string> {
    // Process and store user-uploaded image
    const sizes = await this.createImageSizes(imageBuffer);
    const dominantColor = await this.extractDominantColor(imageBuffer);
    const cdnUrls = await this.uploadToCDN(productId, sizes);

    const image = await prisma.productImage.create({
      data: {
        productId,
        url: cdnUrls.detail,
        thumbnailUrl: cdnUrls.thumbnail,
        cardUrl: cdnUrls.card,
        detailUrl: cdnUrls.detail,
        fullUrl: cdnUrls.full,
        source: 'user_upload',
        width: sizes.detail.width,
        height: sizes.detail.height,
        dominantColor,
        isPrimary: false,
        verified: false,
      },
    });

    return image.url;
  }
}

export const productImageService = new ProductImageService();
