import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

interface ProductSearchResult {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  upc?: string;
  imageUrl?: string;
  averagePrice?: number;
  lowestPrice?: number;
  highestPrice?: number;
}

interface StorePrice {
  storeId: string;
  storeName: string;
  storeSlug: string;
  price: number;
  unitPrice?: number;
  onSale: boolean;
  salePrice?: number;
  distance?: number;
  availability: string;
  lastUpdated: Date;
}

interface StoreRecommendation {
  storeId: string;
  storeName: string;
  storeSlug: string;
  totalCost: number;
  savings: number;
  itemCount: number;
  items: {
    productId: string;
    productName: string;
    price: number;
  }[];
  distance?: number;
}

export class ShoppingService {
  /**
   * Search for products with autocomplete
   */
  async searchProducts(
    query: string,
    limit: number = 20
  ): Promise<ProductSearchResult[]> {
    // Sanitize input
    const sanitizedQuery = query.trim().toLowerCase();

    if (sanitizedQuery.length < 2) {
      return [];
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: sanitizedQuery, mode: 'insensitive' } },
          { brand: { contains: sanitizedQuery, mode: 'insensitive' } },
          { upc: { contains: sanitizedQuery } },
        ],
      },
      take: limit,
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
          select: {
            price: true,
            recordedAt: true,
          },
        },
      },
    });

    return products.map((product) => {
      const prices = product.priceHistory.map((p) => Number(p.price));
      const averagePrice = prices.length > 0
        ? prices.reduce((a, b) => a + b, 0) / prices.length
        : undefined;

      return {
        id: product.id,
        name: product.name,
        brand: product.brand || undefined,
        category: product.category || undefined,
        upc: product.upc || undefined,
        imageUrl: product.imageUrl || undefined,
        averagePrice,
        lowestPrice: prices.length > 0 ? Math.min(...prices) : undefined,
        highestPrice: prices.length > 0 ? Math.max(...prices) : undefined,
      };
    });
  }

  /**
   * Get current prices for a product at all stores
   */
  async getProductPrices(
    productId: string,
    postalCode?: string
  ): Promise<StorePrice[]> {
    // Get latest prices for each store
    const priceHistory = await prisma.priceHistory.findMany({
      where: {
        productId,
        ...(postalCode && { postalCode }),
        recordedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        store: true,
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });

    // Group by store and get most recent price
    const storeMap = new Map<string, typeof priceHistory[0]>();

    for (const price of priceHistory) {
      if (!storeMap.has(price.storeId)) {
        storeMap.set(price.storeId, price);
      }
    }

    return Array.from(storeMap.values()).map((price) => ({
      storeId: price.storeId,
      storeName: price.store.name,
      storeSlug: price.store.slug,
      price: Number(price.price),
      unitPrice: price.unitPrice ? Number(price.unitPrice) : undefined,
      onSale: price.onSale,
      salePrice: price.salePrice ? Number(price.salePrice) : undefined,
      availability: price.availability,
      lastUpdated: price.recordedAt,
    }));
  }

  /**
   * Find cheapest store for each item in a list
   */
  async findCheapestPerItem(
    productIds: string[],
    postalCode?: string
  ): Promise<Map<string, StorePrice>> {
    const result = new Map<string, StorePrice>();

    for (const productId of productIds) {
      const prices = await this.getProductPrices(productId, postalCode);

      if (prices.length > 0) {
        // Find cheapest price
        const cheapest = prices.reduce((prev, curr) =>
          curr.price < prev.price ? curr : prev
        );
        result.set(productId, cheapest);
      }
    }

    return result;
  }

  /**
   * Find cheapest single store for all items
   */
  async findCheapestSingleStore(
    productIds: string[],
    postalCode?: string
  ): Promise<StoreRecommendation[]> {
    // Get prices for all products
    const allPrices = await Promise.all(
      productIds.map((id) => this.getProductPrices(id, postalCode))
    );

    // Group by store
    const storeMap = new Map<string, {
      storeId: string;
      storeName: string;
      storeSlug: string;
      items: Array<{
        productId: string;
        productName: string;
        price: number;
      }>;
      totalCost: number;
    }>();

    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      const prices = allPrices[i];

      for (const price of prices) {
        if (!storeMap.has(price.storeId)) {
          storeMap.set(price.storeId, {
            storeId: price.storeId,
            storeName: price.storeName,
            storeSlug: price.storeSlug,
            items: [],
            totalCost: 0,
          });
        }

        const store = storeMap.get(price.storeId)!;
        store.items.push({
          productId,
          productName: '', // Will be filled below
          price: price.price,
        });
        store.totalCost += price.price;
      }
    }

    // Filter stores that have all products
    const completeStores = Array.from(storeMap.values()).filter(
      (store) => store.items.length === productIds.length
    );

    // Get product names
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productNameMap = new Map(products.map((p) => [p.id, p.name]));

    // Fill in product names and calculate savings
    const recommendations: StoreRecommendation[] = completeStores.map((store) => {
      store.items.forEach((item) => {
        item.productName = productNameMap.get(item.productId) || 'Unknown';
      });

      // Calculate savings compared to most expensive store
      const maxCost = Math.max(...completeStores.map((s) => s.totalCost));
      const savings = maxCost - store.totalCost;

      return {
        storeId: store.storeId,
        storeName: store.storeName,
        storeSlug: store.storeSlug,
        totalCost: store.totalCost,
        savings,
        itemCount: store.items.length,
        items: store.items,
      };
    });

    // Sort by total cost (cheapest first)
    return recommendations.sort((a, b) => a.totalCost - b.totalCost);
  }

  /**
   * Create or update shopping list
   */
  async createShoppingList(
    userId: string,
    name: string,
    items: Array<{ productId?: string; customName?: string; quantity: number }>
  ) {
    return await prisma.shoppingList.create({
      data: {
        userId,
        name,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            customName: item.customName,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Get user's shopping lists
   */
  async getUserShoppingLists(userId: string) {
    return await prisma.shoppingList.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Optimize shopping list (find best stores)
   */
  async optimizeShoppingList(
    listId: string,
    strategy: 'cheapest_per_item' | 'cheapest_single_store' | 'balanced'
  ) {
    const list = await prisma.shoppingList.findUnique({
      where: { id: listId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!list) {
      throw new Error('Shopping list not found');
    }

    const productIds = list.items
      .filter((item) => item.productId)
      .map((item) => item.productId!);

    if (strategy === 'cheapest_per_item') {
      const cheapestPerItem = await this.findCheapestPerItem(
        productIds,
        list.user.postalCode || undefined
      );

      return {
        strategy,
        items: Array.from(cheapestPerItem.entries()).map(([productId, price]) => ({
          productId,
          store: price.storeName,
          price: price.price,
        })),
      };
    } else if (strategy === 'cheapest_single_store') {
      const recommendations = await this.findCheapestSingleStore(
        productIds,
        list.user.postalCode || undefined
      );

      return {
        strategy,
        recommendations,
      };
    }

    // Balanced strategy: Find best 2-3 stores
    const recommendations = await this.findCheapestSingleStore(
      productIds,
      list.user.postalCode || undefined
    );

    return {
      strategy,
      recommendations: recommendations.slice(0, 3),
    };
  }
}

export const shoppingService = new ShoppingService();
