import { prisma } from '@/lib/db';

interface PlatformCartItem {
  productId?: string;
  menuItemId?: string;
  quantity: number;
  platformProductId?: string; // Platform-specific product ID
}

interface SendToAppResult {
  success: boolean;
  method: 'deep_link' | 'api' | 'web_url' | 'clipboard';
  url?: string;
  instructions?: string;
  items?: Array<{ name: string; quantity: number }>;
  error?: string;
}

/**
 * Service for integrating with delivery platform apps and APIs
 * Handles deep linking, API-based cart population, and fallback methods
 */
export class PlatformIntegrationService {
  /**
   * Send cart to platform app
   * Tries multiple methods in order of preference:
   * 1. API integration (if user has connected account)
   * 2. Deep link to app
   * 3. Web URL
   * 4. Clipboard copy with instructions
   */
  async sendCartToPlatform(
    cartId: string,
    userId: string
  ): Promise<SendToAppResult> {
    // Get cart with all items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        platform: true,
        store: true,
        restaurant: true,
        items: {
          include: {
            product: true,
            menuItem: {
              include: {
                restaurant: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return {
        success: false,
        method: 'clipboard',
        error: 'Cart not found',
      };
    }

    // Verify cart belongs to user
    if (cart.userId !== userId) {
      return {
        success: false,
        method: 'clipboard',
        error: 'Unauthorized',
      };
    }

    const platform = cart.platform;

    // Try API integration first (if available)
    if (platform.apiEnabled && platform.slug === 'instacart') {
      const apiResult = await this.sendToInstacartAPI(cart, userId);
      if (apiResult.success) {
        return apiResult;
      }
    }

    // Try platform-specific deep linking
    const deepLinkResult = await this.generateDeepLink(cart);
    if (deepLinkResult.success) {
      return deepLinkResult;
    }

    // Try web URL
    const webResult = await this.generateWebURL(cart);
    if (webResult.success) {
      return webResult;
    }

    // Fallback: clipboard with instructions
    return this.generateClipboardInstructions(cart);
  }

  /**
   * Instacart API integration
   * Requires user to have connected their Instacart account via OAuth
   */
  private async sendToInstacartAPI(
    cart: any,
    userId: string
  ): Promise<SendToAppResult> {
    // Check if user has connected Instacart account
    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platformId: {
          userId,
          platformId: cart.platformId,
        },
      },
    });

    if (!connection || !connection.accessToken) {
      return {
        success: false,
        method: 'api',
        error: 'Instacart account not connected',
      };
    }

    try {
      // TODO: Implement actual Instacart API call
      // This would use the Instacart Partner API to add items to cart
      // For now, return deep link as fallback

      // Example API call structure:
      /*
      const response = await fetch('https://api.instacart.com/v2/carts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.items.map(item => ({
            product_id: item.product?.platformProductId,
            quantity: item.quantity,
          })),
        }),
      });
      */

      return {
        success: false,
        method: 'api',
        error: 'API integration not yet implemented',
      };
    } catch (error) {
      console.error('Instacart API error:', error);
      return {
        success: false,
        method: 'api',
        error: 'Failed to connect to Instacart API',
      };
    }
  }

  /**
   * Generate deep link to platform app
   * Opens the app directly, but may not populate cart automatically
   */
  private async generateDeepLink(cart: any): Promise<SendToAppResult> {
    const platform = cart.platform;

    if (!platform.appScheme) {
      return {
        success: false,
        method: 'deep_link',
        error: 'Deep linking not supported for this platform',
      };
    }

    let deepLink = '';
    const items = cart.items.map((item: any) => ({
      name: item.product?.name || item.menuItem?.name || 'Unknown',
      quantity: item.quantity,
    }));

    switch (platform.slug) {
      case 'instacart':
        // Instacart deep link format: instacart://store/{store_id}
        // Or: instacart://product/{product_id}
        if (cart.storeId) {
          // Deep link to store
          deepLink = `${platform.appScheme}store/${cart.store?.slug || cart.storeId}`;
        } else {
          // Just open app
          deepLink = platform.appScheme;
        }
        break;

      case 'uber-eats':
      case 'ubereats':
        // Uber Eats: ubereats://restaurant/{restaurant_id}
        if (cart.restaurantId) {
          deepLink = `${platform.appScheme}restaurant/${cart.restaurant?.slug || cart.restaurantId}`;
        } else {
          deepLink = platform.appScheme;
        }
        break;

      case 'doordash':
        // DoorDash: doordash://store/{store_id}
        if (cart.restaurantId) {
          deepLink = `${platform.appScheme}store/${cart.restaurant?.slug || cart.restaurantId}`;
        } else {
          deepLink = platform.appScheme;
        }
        break;

      default:
        // Generic: just open the app
        deepLink = platform.appScheme;
    }

    return {
      success: true,
      method: 'deep_link',
      url: deepLink,
      items,
      instructions: this.getManualInstructions(platform.name, items),
    };
  }

  /**
   * Generate web URL with cart items (where supported)
   */
  private async generateWebURL(cart: any): Promise<SendToAppResult> {
    const platform = cart.platform;

    if (!platform.website) {
      return {
        success: false,
        method: 'web_url',
        error: 'Web URL not available',
      };
    }

    let webUrl = platform.website;
    const items = cart.items.map((item: any) => ({
      name: item.product?.name || item.menuItem?.name || 'Unknown',
      quantity: item.quantity,
    }));

    // Some platforms support URL parameters for cart items
    switch (platform.slug) {
      case 'instacart':
        // Instacart web: https://www.instacart.com/store/{store_slug}
        if (cart.store) {
          webUrl = `${platform.website}/store/${cart.store.slug}`;
        }
        break;

      case 'amazon-fresh':
        // Amazon: Can use search params
        webUrl = platform.website;
        break;

      default:
        webUrl = platform.website;
    }

    return {
      success: true,
      method: 'web_url',
      url: webUrl,
      items,
      instructions: this.getManualInstructions(platform.name, items),
    };
  }

  /**
   * Generate clipboard-friendly shopping list with instructions
   */
  private generateClipboardInstructions(cart: any): SendToAppResult {
    const platform = cart.platform;
    const items = cart.items.map((item: any) => ({
      name: item.product?.name || item.menuItem?.name || 'Unknown',
      quantity: item.quantity,
    }));

    const instructions = this.getManualInstructions(platform.name, items);

    return {
      success: true,
      method: 'clipboard',
      items,
      instructions,
    };
  }

  /**
   * Get manual instructions for adding items to platform
   */
  private getManualInstructions(platformName: string, items: any[]): string {
    const itemList = items
      .map((item) => `- ${item.name} (${item.quantity}x)`)
      .join('\n');

    return `
To add these items to ${platformName}:

1. Open the ${platformName} app
2. Search for and add each item:

${itemList}

3. Proceed to checkout

We'll continue improving automatic cart population as platforms enable API access.
    `.trim();
  }

  /**
   * Connect user's platform account (OAuth flow)
   */
  async connectPlatformAccount(
    userId: string,
    platformId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ) {
    return prisma.platformConnection.upsert({
      where: {
        userId_platformId: {
          userId,
          platformId,
        },
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt,
        connectedAt: new Date(),
      },
      create: {
        userId,
        platformId,
        accessToken,
        refreshToken,
        expiresAt,
        connectedAt: new Date(),
      },
    });
  }

  /**
   * Disconnect platform account
   */
  async disconnectPlatformAccount(userId: string, platformId: string) {
    return prisma.platformConnection.delete({
      where: {
        userId_platformId: {
          userId,
          platformId,
        },
      },
    });
  }

  /**
   * Get user's connected platforms
   */
  async getConnectedPlatforms(userId: string) {
    return prisma.platformConnection.findMany({
      where: { userId },
      include: {
        platform: true,
      },
    });
  }

  /**
   * Generate "quick add" links for individual items
   * Some platforms support deep linking to specific products
   */
  async generateItemDeepLink(
    platformId: string,
    productId?: string,
    menuItemId?: string
  ): Promise<string | null> {
    const platform = await prisma.deliveryPlatform.findUnique({
      where: { id: platformId },
    });

    if (!platform || !platform.appScheme) {
      return null;
    }

    // Get platform-specific product ID if available
    let platformProductId: string | null = null;

    if (productId) {
      const platformPrice = await prisma.productPlatformPrice.findUnique({
        where: {
          productId_platformId: {
            productId,
            platformId,
          },
        },
      });
      platformProductId = platformPrice?.platformProductId || null;
    } else if (menuItemId) {
      const platformPrice = await prisma.menuItemPlatformPrice.findUnique({
        where: {
          menuItemId_platformId: {
            menuItemId,
            platformId,
          },
        },
      });
      platformProductId = platformPrice?.platformProductId || null;
    }

    if (!platformProductId) {
      // No platform-specific ID, just return generic app scheme
      return platform.appScheme;
    }

    // Generate platform-specific deep link
    switch (platform.slug) {
      case 'instacart':
        return `${platform.appScheme}product/${platformProductId}`;

      case 'uber-eats':
      case 'ubereats':
        return `${platform.appScheme}item/${platformProductId}`;

      case 'doordash':
        return `${platform.appScheme}item/${platformProductId}`;

      default:
        return platform.appScheme;
    }
  }
}

export const platformIntegrationService = new PlatformIntegrationService();
