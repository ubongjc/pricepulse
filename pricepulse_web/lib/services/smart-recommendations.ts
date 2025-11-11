import { prisma } from '@/lib/db';

interface RecommendationScore {
  productId: string;
  score: number;
  reasons: string[];
}

/**
 * Smart Recommendations Service
 * Provides AI-powered product recommendations based on user behavior
 */
export class SmartRecommendationsService {
  /**
   * Get personalized product recommendations for user
   */
  async getRecommendations(userId: string, limit: number = 10) {
    const [
      preferences,
      purchaseHistory,
      priceAlerts,
      purchasePatterns,
    ] = await Promise.all([
      this.getUserPreferences(userId),
      this.getPurchaseHistory(userId),
      prisma.priceAlert.findMany({
        where: { userId },
        include: { product: true },
      }),
      prisma.purchasePattern.findMany({
        where: { userId },
        include: { product: true },
      }),
    ]);

    const recommendations: RecommendationScore[] = [];

    // Recommend products on price alerts
    for (const alert of priceAlerts) {
      recommendations.push({
        productId: alert.productId,
        score: 90,
        reasons: ['You have a price alert for this product'],
      });
    }

    // Recommend products based on purchase patterns
    for (const pattern of purchasePatterns) {
      if (pattern.nextPredictedDate) {
        const daysTillNext = Math.ceil(
          (pattern.nextPredictedDate.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysTillNext <= 7 && daysTillNext >= 0) {
          recommendations.push({
            productId: pattern.productId,
            score: 85 - daysTillNext * 5,
            reasons: [
              `You usually buy this every ${pattern.averageFrequency} days`,
              `Next purchase predicted in ${daysTillNext} days`,
            ],
          });
        }
      }
    }

    // Recommend products from preferred categories
    if (purchaseHistory.length > 0) {
      const categoryFrequency = this.calculateCategoryFrequency(purchaseHistory);
      const topCategories = Object.entries(categoryFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat);

      const categoryProducts = await prisma.product.findMany({
        where: {
          category: { in: topCategories },
          id: { notIn: purchaseHistory.map((p) => p.productId || '') },
        },
        take: 20,
      });

      for (const product of categoryProducts) {
        recommendations.push({
          productId: product.id,
          score: 60,
          reasons: [`Popular in ${product.category} category`],
        });
      }
    }

    // Apply preference filters
    if (preferences) {
      // Remove disliked products
      const filtered = recommendations.filter(
        (rec) => !preferences.dislikedProducts.includes(rec.productId)
      );

      // Get full product info for dietary restrictions
      const productIds = filtered.map((r) => r.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          priceHistory: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      return filtered
        .filter((rec) => {
          const product = productMap.get(rec.productId);
          if (!product) return false;

          // Apply dietary restrictions
          if (
            preferences.dietaryRestrictions.includes('vegan') &&
            !product.vegan
          ) {
            return false;
          }
          if (
            preferences.dietaryRestrictions.includes('gluten_free') &&
            !product.glutenFree
          ) {
            return false;
          }

          return true;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((rec) => ({
          product: productMap.get(rec.productId),
          score: rec.score,
          reasons: rec.reasons,
        }));
    }

    // Return top recommendations
    const productIds = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((rec) => ({
        product: productMap.get(rec.productId),
        score: rec.score,
        reasons: rec.reasons,
      }));
  }

  /**
   * Get store recommendations based on user preferences and savings
   */
  async getStoreRecommendations(userId: string, postalCode?: string) {
    const preferences = await this.getUserPreferences(userId);
    const purchaseHistory = await this.getPurchaseHistory(userId);

    // Calculate savings by store
    const storeSavings = new Map<string, number>();

    for (const item of purchaseHistory) {
      const receipt = await prisma.receipt.findUnique({
        where: { id: item.receiptId },
      });

      if (receipt) {
        const current = storeSavings.get(receipt.storeName) || 0;
        storeSavings.set(receipt.storeName, current + Number(item.totalPrice));
      }
    }

    // Get stores
    const stores = await prisma.store.findMany({
      where: { active: true },
      include: {
        locations: {
          where: postalCode ? { postalCode } : undefined,
          take: 1,
        },
      },
    });

    return stores
      .map((store) => ({
        store,
        totalSpent: storeSavings.get(store.name) || 0,
        isPreferred: preferences?.preferredStores.includes(store.id) || false,
        hasNearbyLocation: store.locations.length > 0,
      }))
      .sort((a, b) => {
        if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1;
        if (a.hasNearbyLocation !== b.hasNearbyLocation)
          return a.hasNearbyLocation ? -1 : 1;
        return b.totalSpent - a.totalSpent;
      });
  }

  /**
   * Create smart reminders for user
   */
  async createSmartReminders(userId: string) {
    const patterns = await prisma.purchasePattern.findMany({
      where: { userId },
      include: { product: true },
    });

    const reminders = [];

    for (const pattern of patterns) {
      if (pattern.nextPredictedDate && pattern.confidence >= 70) {
        const daysTillNext = Math.ceil(
          (pattern.nextPredictedDate.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );

        // Create reminder 2 days before predicted purchase
        if (daysTillNext === 2) {
          const reminder = await prisma.smartReminder.create({
            data: {
              userId,
              productId: pattern.productId,
              type: 'purchase_pattern',
              title: `Time to buy ${pattern.product.name}?`,
              message: `Based on your purchase history, you usually buy this item every ${pattern.averageFrequency} days.`,
              scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
              metadata: {
                confidence: Number(pattern.confidence),
                averageFrequency: pattern.averageFrequency,
              },
            },
          });

          reminders.push(reminder);
        }
      }
    }

    return reminders;
  }

  /**
   * Get pending reminders for user
   */
  async getReminders(userId: string) {
    return prisma.smartReminder.findMany({
      where: {
        userId,
        dismissed: false,
        scheduledFor: { lte: new Date() },
        sentAt: null,
      },
      include: { product: true },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(reminderId: string) {
    return prisma.smartReminder.update({
      where: { id: reminderId },
      data: { sentAt: new Date() },
    });
  }

  /**
   * Dismiss reminder
   */
  async dismissReminder(reminderId: string) {
    return prisma.smartReminder.update({
      where: { id: reminderId },
      data: { dismissed: true },
    });
  }

  /**
   * Analyze purchase patterns and update predictions
   */
  async analyzePurchasePatterns(userId: string) {
    const receipts = await prisma.receipt.findMany({
      where: { userId },
      include: { lineItems: true },
      orderBy: { transactionDate: 'asc' },
    });

    const productPurchases = new Map<
      string,
      { dates: Date[]; name: string }
    >();

    // Group purchases by product
    for (const receipt of receipts) {
      for (const item of receipt.lineItems) {
        if (!item.upc) continue;

        const product = await prisma.product.findUnique({
          where: { upc: item.upc },
        });

        if (product) {
          if (!productPurchases.has(product.id)) {
            productPurchases.set(product.id, {
              dates: [],
              name: product.name,
            });
          }
          productPurchases.get(product.id)!.dates.push(receipt.transactionDate);
        }
      }
    }

    // Calculate patterns
    const patterns = [];

    for (const [productId, data] of productPurchases) {
      if (data.dates.length < 2) continue;

      const intervals = [];
      for (let i = 1; i < data.dates.length; i++) {
        const days = Math.ceil(
          (data.dates[i].getTime() - data.dates[i - 1].getTime()) /
            (1000 * 60 * 60 * 24)
        );
        intervals.push(days);
      }

      const averageFrequency = Math.round(
        intervals.reduce((a, b) => a + b, 0) / intervals.length
      );

      const stdDev = Math.sqrt(
        intervals.reduce(
          (sum, interval) => sum + Math.pow(interval - averageFrequency, 2),
          0
        ) / intervals.length
      );

      const confidence = Math.max(0, 100 - (stdDev / averageFrequency) * 100);

      const lastPurchaseDate = data.dates[data.dates.length - 1];
      const nextPredictedDate = new Date(
        lastPurchaseDate.getTime() + averageFrequency * 24 * 60 * 60 * 1000
      );

      const pattern = await prisma.purchasePattern.upsert({
        where: { userId_productId: { userId, productId } },
        create: {
          userId,
          productId,
          averageFrequency,
          lastPurchaseDate,
          nextPredictedDate,
          confidence,
          totalPurchases: data.dates.length,
        },
        update: {
          averageFrequency,
          lastPurchaseDate,
          nextPredictedDate,
          confidence,
          totalPurchases: data.dates.length,
        },
      });

      patterns.push(pattern);
    }

    return patterns;
  }

  /**
   * Get user preferences or create default
   */
  private async getUserPreferences(userId: string) {
    return prisma.userPreference.findUnique({
      where: { userId },
    });
  }

  /**
   * Get user purchase history
   */
  private async getPurchaseHistory(userId: string) {
    const receipts = await prisma.receipt.findMany({
      where: { userId },
      include: { lineItems: true },
      orderBy: { transactionDate: 'desc' },
      take: 50,
    });

    return receipts.flatMap((r) => r.lineItems);
  }

  /**
   * Calculate category frequency from purchase history
   */
  private calculateCategoryFrequency(lineItems: any[]): Record<string, number> {
    const frequency: Record<string, number> = {};

    for (const item of lineItems) {
      if (item.category) {
        frequency[item.category] = (frequency[item.category] || 0) + 1;
      }
    }

    return frequency;
  }
}

export const smartRecommendationsService = new SmartRecommendationsService();
