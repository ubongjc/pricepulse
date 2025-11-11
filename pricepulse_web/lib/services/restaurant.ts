import { prisma } from '@/lib/db';
import { subDays, format } from 'date-fns';

interface RestaurantSearchResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  cuisine: string | null;
  priceRange: string | null;
  logo: string | null;
  menuItemCount: number;
}

interface MenuItemSearchResult {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  category: string | null;
  calories: number | null;
  basePrice: number;
  platformPrices: Array<{
    platformName: string;
    price: number;
    markup: number;
  }>;
}

interface RestaurantInflation {
  restaurantName: string;
  restaurantSlug: string;
  currentAverage: number;
  previousAverage: number;
  inflationRate: number;
  menuItemCount: number;
  platformCount: number;
}

export class RestaurantService {
  /**
   * Search for restaurants
   */
  async searchRestaurants(
    query: string,
    category?: string,
    cuisine?: string,
    limit: number = 20
  ): Promise<RestaurantSearchResult[]> {
    const where: any = { active: true };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (cuisine) {
      where.cuisine = cuisine;
    }

    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category,
      cuisine: r.cuisine,
      priceRange: r.priceRange,
      logo: r.logo,
      menuItemCount: r._count.menuItems,
    }));
  }

  /**
   * Get restaurant details with menu items
   */
  async getRestaurantDetails(restaurantId: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menuItems: {
          where: { available: true },
          include: {
            platformPrices: {
              include: {
                platform: true,
              },
            },
          },
          orderBy: { category: 'asc' },
        },
        locations: {
          where: { active: true },
          take: 10,
        },
        platformAvailability: {
          include: {
            platform: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    return restaurant;
  }

  /**
   * Search for menu items across restaurants
   */
  async searchMenuItems(
    query: string,
    restaurantId?: string,
    category?: string,
    limit: number = 50
  ): Promise<MenuItemSearchResult[]> {
    const where: any = { available: true };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (category) {
      where.category = category;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        restaurant: {
          select: { name: true },
        },
        platformPrices: {
          include: {
            platform: {
              select: { name: true },
            },
          },
        },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return menuItems.map((item) => ({
      id: item.id,
      restaurantId: item.restaurantId,
      restaurantName: item.restaurant.name,
      name: item.name,
      category: item.category,
      calories: item.calories,
      basePrice: Number(item.basePrice),
      platformPrices: item.platformPrices.map((pp) => ({
        platformName: pp.platform.name,
        price: Number(pp.price),
        markup: Number(pp.markup),
      })),
    }));
  }

  /**
   * Get menu item price history
   */
  async getMenuItemPriceHistory(
    menuItemId: string,
    days: number = 90
  ): Promise<Array<{ date: string; averagePrice: number }>> {
    const startDate = subDays(new Date(), days);

    const priceHistory = await prisma.menuItemPriceHistory.findMany({
      where: {
        menuItemId,
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
    }));
  }

  /**
   * Get restaurant inflation comparison
   */
  async getRestaurantInflation(
    days: number = 30
  ): Promise<RestaurantInflation[]> {
    const currentDate = new Date();
    const previousDate = subDays(currentDate, days);

    const restaurants = await prisma.restaurant.findMany({
      where: { active: true },
      include: {
        menuItems: {
          where: { available: true },
          include: {
            priceHistory: {
              where: {
                recordedAt: { gte: subDays(currentDate, days + 7) },
              },
            },
            platformPrices: true,
          },
        },
      },
    });

    const inflationData: RestaurantInflation[] = [];

    for (const restaurant of restaurants) {
      const currentPrices: number[] = [];
      const previousPrices: number[] = [];
      const platformSet = new Set<string>();

      for (const item of restaurant.menuItems) {
        // Current prices (last 7 days)
        const recentPrices = item.priceHistory.filter(
          (ph) => ph.recordedAt >= subDays(currentDate, 7)
        );

        if (recentPrices.length > 0) {
          const avgRecent =
            recentPrices.reduce((sum, ph) => sum + Number(ph.price), 0) /
            recentPrices.length;
          currentPrices.push(avgRecent);
        }

        // Previous prices (7 days around the previous date)
        const oldPrices = item.priceHistory.filter(
          (ph) =>
            ph.recordedAt >= subDays(previousDate, 7) &&
            ph.recordedAt <= previousDate
        );

        if (oldPrices.length > 0) {
          const avgOld =
            oldPrices.reduce((sum, ph) => sum + Number(ph.price), 0) /
            oldPrices.length;
          previousPrices.push(avgOld);
        }

        // Count unique platforms
        item.platformPrices.forEach((pp) => platformSet.add(pp.platformId));
      }

      if (currentPrices.length > 0 && previousPrices.length > 0) {
        const currentAvg =
          currentPrices.reduce((a, b) => a + b, 0) / currentPrices.length;
        const previousAvg =
          previousPrices.reduce((a, b) => a + b, 0) / previousPrices.length;

        const inflationRate =
          previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;

        inflationData.push({
          restaurantName: restaurant.name,
          restaurantSlug: restaurant.slug,
          currentAverage: currentAvg,
          previousAverage: previousAvg,
          inflationRate,
          menuItemCount: restaurant.menuItems.length,
          platformCount: platformSet.size,
        });
      }
    }

    // Sort by inflation rate (highest first)
    return inflationData.sort((a, b) => b.inflationRate - a.inflationRate);
  }

  /**
   * Compare menu item prices across platforms
   */
  async compareMenuItemAcrossPlatforms(menuItemId: string) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        restaurant: true,
        platformPrices: {
          include: {
            platform: true,
          },
        },
      },
    });

    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    const platforms = menuItem.platformPrices.map((pp) => ({
      platformName: pp.platform.name,
      platformSlug: pp.platform.slug,
      price: Number(pp.price),
      markup: Number(pp.markup),
      markupPercent: ((Number(pp.markup) / Number(menuItem.basePrice)) * 100).toFixed(2),
      appScheme: pp.platform.appScheme,
      deliveryFeeMin: pp.platform.deliveryFeeMin ? Number(pp.platform.deliveryFeeMin) : null,
      deliveryFeeMax: pp.platform.deliveryFeeMax ? Number(pp.platform.deliveryFeeMax) : null,
      serviceFeePercent: pp.platform.serviceFeePercent ? Number(pp.platform.serviceFeePercent) : null,
    }));

    // Sort by total cost (price + estimated fees)
    platforms.sort((a, b) => {
      const totalA = a.price + (a.deliveryFeeMin || 0);
      const totalB = b.price + (b.deliveryFeeMin || 0);
      return totalA - totalB;
    });

    return {
      menuItem: {
        name: menuItem.name,
        restaurantName: menuItem.restaurant.name,
        category: menuItem.category,
        calories: menuItem.calories,
        basePrice: Number(menuItem.basePrice),
      },
      platforms,
      bestPlatform: platforms[0],
      worstPlatform: platforms[platforms.length - 1],
      potentialSavings:
        platforms.length > 1
          ? platforms[platforms.length - 1].price - platforms[0].price
          : 0,
    };
  }

  /**
   * Get available platforms for a restaurant
   */
  async getRestaurantPlatforms(restaurantId: string) {
    const availability = await prisma.restaurantAvailability.findMany({
      where: { restaurantId },
      include: {
        platform: true,
      },
    });

    return availability.map((av) => ({
      platformId: av.platformId,
      platformName: av.platform.name,
      platformSlug: av.platform.slug,
      available: av.available,
      deliveryEnabled: av.deliveryEnabled,
      pickupEnabled: av.pickupEnabled,
      appScheme: av.platform.appScheme,
      iosAppId: av.platform.iosAppId,
      androidPackage: av.platform.androidPackage,
    }));
  }

  /**
   * Find restaurants by location
   */
  async findRestaurantsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 50
  ) {
    // Simple distance calculation (can be improved with PostGIS)
    // For now, use a bounding box
    const latDelta = radiusKm / 111; // Rough conversion: 1 degree lat ≈ 111 km
    const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const locations = await prisma.restaurantLocation.findMany({
      where: {
        active: true,
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lonDelta,
          lte: longitude + lonDelta,
        },
      },
      include: {
        restaurant: true,
        platformAvailability: {
          include: {
            platform: true,
          },
        },
      },
      take: limit,
    });

    return locations.map((loc) => ({
      locationId: loc.id,
      restaurant: {
        id: loc.restaurant.id,
        name: loc.restaurant.name,
        slug: loc.restaurant.slug,
        category: loc.restaurant.category,
        cuisine: loc.restaurant.cuisine,
        priceRange: loc.restaurant.priceRange,
      },
      address: loc.address,
      city: loc.city,
      state: loc.state,
      postalCode: loc.postalCode,
      country: loc.country,
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      platforms: loc.platformAvailability.map((pa) => ({
        name: pa.platform.name,
        slug: pa.platform.slug,
        deliveryEnabled: pa.deliveryEnabled,
        pickupEnabled: pa.pickupEnabled,
      })),
    }));
  }
}

export const restaurantService = new RestaurantService();
