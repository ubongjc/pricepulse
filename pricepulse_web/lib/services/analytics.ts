import { prisma } from '@/lib/db';
import { subDays, subMonths, startOfDay, endOfDay, format } from 'date-fns';

interface InflationData {
  period: string;
  averageInflation: number;
  categoryInflation: Record<string, number>;
  storeInflation: Record<string, number>;
}

interface PriceTrend {
  date: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  sampleCount: number;
}

interface StoreComparison {
  storeName: string;
  storeSlug: string;
  currentAverage: number;
  previousAverage: number;
  inflationRate: number;
  productCount: number;
}

export class AnalyticsService {
  /**
   * Calculate inflation rate between two periods
   */
  private calculateInflation(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Get inflation data for a specific product
   */
  async getProductInflation(
    productId: string,
    days: number = 30
  ): Promise<PriceTrend[]> {
    const startDate = subDays(new Date(), days);

    const priceHistory = await prisma.priceHistory.findMany({
      where: {
        productId,
        recordedAt: { gte: startDate },
      },
      orderBy: { recordedAt: 'asc' },
    });

    // Group by date
    const dailyPrices = new Map<string, number[]>();

    for (const price of priceHistory) {
      const dateKey = format(price.recordedAt, 'yyyy-MM-dd');
      if (!dailyPrices.has(dateKey)) {
        dailyPrices.set(dateKey, []);
      }
      dailyPrices.get(dateKey)!.push(Number(price.price));
    }

    // Calculate daily averages
    return Array.from(dailyPrices.entries()).map(([date, prices]) => ({
      date,
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      sampleCount: prices.length,
    }));
  }

  /**
   * Get inflation rate by category
   */
  async getCategoryInflation(
    days: number = 30
  ): Promise<Record<string, number>> {
    const currentDate = new Date();
    const previousDate = subDays(currentDate, days);

    // Get average prices for each category in both periods
    const currentPrices = await prisma.priceHistory.groupBy({
      by: ['productId'],
      where: {
        recordedAt: { gte: subDays(currentDate, 7) },
      },
      _avg: {
        price: true,
      },
    });

    const previousPrices = await prisma.priceHistory.groupBy({
      by: ['productId'],
      where: {
        recordedAt: {
          gte: subDays(previousDate, 7),
          lte: previousDate,
        },
      },
      _avg: {
        price: true,
      },
    });

    // Get product categories
    const productIds = [
      ...new Set([
        ...currentPrices.map((p) => p.productId),
        ...previousPrices.map((p) => p.productId),
      ]),
    ];

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: true },
    });

    const productCategoryMap = new Map(
      products.map((p) => [p.id, p.category || 'Uncategorized'])
    );

    // Group by category
    const currentByCategory = new Map<string, number[]>();
    const previousByCategory = new Map<string, number[]>();

    for (const price of currentPrices) {
      const category = productCategoryMap.get(price.productId) || 'Uncategorized';
      if (!currentByCategory.has(category)) {
        currentByCategory.set(category, []);
      }
      if (price._avg.price) {
        currentByCategory.get(category)!.push(Number(price._avg.price));
      }
    }

    for (const price of previousPrices) {
      const category = productCategoryMap.get(price.productId) || 'Uncategorized';
      if (!previousByCategory.has(category)) {
        previousByCategory.set(category, []);
      }
      if (price._avg.price) {
        previousByCategory.get(category)!.push(Number(price._avg.price));
      }
    }

    // Calculate inflation per category
    const inflation: Record<string, number> = {};

    for (const [category, currentPrices] of currentByCategory.entries()) {
      const previousPrices = previousByCategory.get(category) || [];

      if (currentPrices.length > 0 && previousPrices.length > 0) {
        const currentAvg = currentPrices.reduce((a, b) => a + b, 0) / currentPrices.length;
        const previousAvg = previousPrices.reduce((a, b) => a + b, 0) / previousPrices.length;
        inflation[category] = this.calculateInflation(currentAvg, previousAvg);
      }
    }

    return inflation;
  }

  /**
   * Compare inflation across stores
   */
  async getStoreInflation(days: number = 30): Promise<StoreComparison[]> {
    const currentDate = new Date();
    const previousDate = subDays(currentDate, days);

    // Get stores
    const stores = await prisma.store.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true },
    });

    const comparisons: StoreComparison[] = [];

    for (const store of stores) {
      // Current period average
      const currentPrices = await prisma.priceHistory.aggregate({
        where: {
          storeId: store.id,
          recordedAt: { gte: subDays(currentDate, 7) },
        },
        _avg: { price: true },
        _count: true,
      });

      // Previous period average
      const previousPrices = await prisma.priceHistory.aggregate({
        where: {
          storeId: store.id,
          recordedAt: {
            gte: subDays(previousDate, 7),
            lte: previousDate,
          },
        },
        _avg: { price: true },
      });

      if (currentPrices._avg.price && previousPrices._avg.price) {
        const currentAvg = Number(currentPrices._avg.price);
        const previousAvg = Number(previousPrices._avg.price);

        comparisons.push({
          storeName: store.name,
          storeSlug: store.slug,
          currentAverage: currentAvg,
          previousAverage: previousAvg,
          inflationRate: this.calculateInflation(currentAvg, previousAvg),
          productCount: currentPrices._count,
        });
      }
    }

    // Sort by inflation rate (highest first)
    return comparisons.sort((a, b) => b.inflationRate - a.inflationRate);
  }

  /**
   * Get user spending analysis
   */
  async getUserSpendingAnalysis(
    userId: string,
    months: number = 3
  ): Promise<{
    totalSpent: number;
    averagePerMonth: number;
    byCategory: Record<string, number>;
    byStore: Record<string, number>;
    trend: Array<{ month: string; amount: number }>;
  }> {
    const startDate = subMonths(new Date(), months);

    const receipts = await prisma.receipt.findMany({
      where: {
        userId,
        transactionDate: { gte: startDate },
      },
      include: {
        lineItems: {
          include: {
            receipt: true,
          },
        },
      },
    });

    const totalSpent = receipts.reduce(
      (sum, r) => sum + Number(r.totalAmount),
      0
    );

    const averagePerMonth = totalSpent / months;

    // By category
    const byCategory: Record<string, number> = {};
    for (const receipt of receipts) {
      for (const item of receipt.lineItems) {
        const category = item.category || 'Uncategorized';
        byCategory[category] = (byCategory[category] || 0) + Number(item.totalPrice);
      }
    }

    // By store
    const byStore: Record<string, number> = {};
    for (const receipt of receipts) {
      const store = receipt.storeName;
      byStore[store] = (byStore[store] || 0) + Number(receipt.totalAmount);
    }

    // Monthly trend
    const monthlySpending = new Map<string, number>();
    for (const receipt of receipts) {
      const monthKey = format(receipt.transactionDate, 'yyyy-MM');
      monthlySpending.set(
        monthKey,
        (monthlySpending.get(monthKey) || 0) + Number(receipt.totalAmount)
      );
    }

    const trend = Array.from(monthlySpending.entries()).map(([month, amount]) => ({
      month,
      amount,
    })).sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalSpent,
      averagePerMonth,
      byCategory,
      byStore,
      trend,
    };
  }

  /**
   * Get product-specific store comparison
   */
  async compareStoresForProduct(
    productId: string,
    days: number = 30
  ): Promise<{
    productName: string;
    stores: Array<{
      storeName: string;
      storeSlug: string;
      currentPrice: number;
      averagePrice: number;
      priceChange: number;
      inflationRate: number;
    }>;
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const startDate = subDays(new Date(), days);
    const midDate = subDays(new Date(), days / 2);

    const stores = await prisma.store.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true },
    });

    const storeComparisons = [];

    for (const store of stores) {
      // Current price (last 7 days)
      const current = await prisma.priceHistory.findFirst({
        where: {
          productId,
          storeId: store.id,
          recordedAt: { gte: subDays(new Date(), 7) },
        },
        orderBy: { recordedAt: 'desc' },
      });

      // Previous period average
      const previous = await prisma.priceHistory.aggregate({
        where: {
          productId,
          storeId: store.id,
          recordedAt: {
            gte: subDays(midDate, 7),
            lte: midDate,
          },
        },
        _avg: { price: true },
      });

      // Overall average
      const overall = await prisma.priceHistory.aggregate({
        where: {
          productId,
          storeId: store.id,
          recordedAt: { gte: startDate },
        },
        _avg: { price: true },
      });

      if (current && previous._avg.price && overall._avg.price) {
        const currentPrice = Number(current.price);
        const previousPrice = Number(previous._avg.price);
        const averagePrice = Number(overall._avg.price);

        storeComparisons.push({
          storeName: store.name,
          storeSlug: store.slug,
          currentPrice,
          averagePrice,
          priceChange: currentPrice - previousPrice,
          inflationRate: this.calculateInflation(currentPrice, previousPrice),
        });
      }
    }

    return {
      productName: product.name,
      stores: storeComparisons.sort((a, b) => a.currentPrice - b.currentPrice),
    };
  }
}

export const analyticsService = new AnalyticsService();
