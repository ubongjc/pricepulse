import { prisma } from '@/lib/db';

interface CartItemInput {
  productId?: string;
  menuItemId?: string;
  quantity: number;
  customizations?: any;
}

interface CartSummary {
  cartId: string;
  platformName: string;
  storeName?: string;
  restaurantName?: string;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customizations?: any;
  }>;
}

export class CartService {
  /**
   * Create a new cart for a user
   */
  async createCart(
    userId: string,
    platformId: string,
    storeId?: string,
    restaurantId?: string
  ) {
    // Validate platform exists
    const platform = await prisma.deliveryPlatform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      throw new Error('Platform not found');
    }

    // Validate store or restaurant
    if (storeId) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });
      if (!store) {
        throw new Error('Store not found');
      }
    }

    if (restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }
    }

    // Check if user already has an active cart for this platform + store/restaurant
    const existingCart = await prisma.cart.findFirst({
      where: {
        userId,
        platformId,
        storeId: storeId || null,
        restaurantId: restaurantId || null,
        status: 'active',
      },
    });

    if (existingCart) {
      return existingCart;
    }

    // Create new cart
    return prisma.cart.create({
      data: {
        userId,
        platformId,
        storeId,
        restaurantId,
        status: 'active',
        subtotal: 0,
        total: 0,
      },
    });
  }

  /**
   * Add item to cart
   */
  async addItem(cartId: string, item: CartItemInput) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        platform: true,
      },
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    if (cart.status !== 'active') {
      throw new Error('Cart is not active');
    }

    let unitPrice = 0;

    // Get price based on item type
    if (item.productId) {
      // Check if there's a platform-specific price
      const platformPrice = await prisma.productPlatformPrice.findUnique({
        where: {
          productId_platformId: {
            productId: item.productId,
            platformId: cart.platformId,
          },
        },
      });

      if (platformPrice) {
        unitPrice = Number(platformPrice.price);
      } else {
        // Fall back to product base price
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new Error('Product not found');
        }
        // Use latest price from history or set to 0
        const latestPrice = await prisma.priceHistory.findFirst({
          where: { productId: item.productId },
          orderBy: { recordedAt: 'desc' },
        });
        unitPrice = latestPrice ? Number(latestPrice.price) : 0;
      }
    } else if (item.menuItemId) {
      // Check if there's a platform-specific price
      const platformPrice = await prisma.menuItemPlatformPrice.findUnique({
        where: {
          menuItemId_platformId: {
            menuItemId: item.menuItemId,
            platformId: cart.platformId,
          },
        },
      });

      if (platformPrice) {
        unitPrice = Number(platformPrice.price);
      } else {
        // Fall back to menu item base price
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId },
        });
        if (!menuItem) {
          throw new Error('Menu item not found');
        }
        unitPrice = Number(menuItem.basePrice);
      }
    } else {
      throw new Error('Either productId or menuItemId must be provided');
    }

    const totalPrice = unitPrice * item.quantity;

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: item.productId || null,
        menuItemId: item.menuItemId || null,
      },
    });

    if (existingItem) {
      // Update quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + item.quantity,
          totalPrice: Number(existingItem.totalPrice) + totalPrice,
        },
      });

      await this.recalculateCart(cartId);
      return updatedItem;
    }

    // Create new cart item
    const cartItem = await prisma.cartItem.create({
      data: {
        cartId,
        productId: item.productId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        customizations: item.customizations,
      },
    });

    await this.recalculateCart(cartId);
    return cartItem;
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(cartItemId);
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    const totalPrice = Number(cartItem.unitPrice) * quantity;

    const updated = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity,
        totalPrice,
      },
    });

    await this.recalculateCart(cartItem.cartId);
    return updated;
  }

  /**
   * Remove item from cart
   */
  async removeItem(cartItemId: string) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    await this.recalculateCart(cartItem.cartId);
  }

  /**
   * Recalculate cart totals
   */
  private async recalculateCart(cartId: string) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: true,
        platform: true,
      },
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    // Calculate delivery fee (simple logic, can be more complex)
    let deliveryFee = 0;
    if (cart.platform.deliveryFeeMin && cart.platform.deliveryFeeMax) {
      // Use min fee if order is above minimum, otherwise use max
      const minimumOrder = Number(cart.platform.minimumOrder || 0);
      deliveryFee = subtotal >= minimumOrder
        ? Number(cart.platform.deliveryFeeMin)
        : Number(cart.platform.deliveryFeeMax);
    }

    // Calculate service fee
    const serviceFeePercent = Number(cart.platform.serviceFeePercent || 0);
    const serviceFee = (subtotal * serviceFeePercent) / 100;

    // Calculate total
    const total = subtotal + deliveryFee + serviceFee;

    // Update cart
    await prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal,
        deliveryFee,
        serviceFee,
        total,
      },
    });
  }

  /**
   * Get cart summary with all details
   */
  async getCartSummary(cartId: string): Promise<CartSummary> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        platform: true,
        store: true,
        restaurant: true,
        items: {
          include: {
            product: true,
            menuItem: true,
          },
        },
      },
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    const items = cart.items.map((item) => ({
      id: item.id,
      name: item.product?.name || item.menuItem?.name || 'Unknown',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      customizations: item.customizations,
    }));

    return {
      cartId: cart.id,
      platformName: cart.platform.name,
      storeName: cart.store?.name,
      restaurantName: cart.restaurant?.name,
      itemCount: cart.items.length,
      subtotal: Number(cart.subtotal),
      deliveryFee: Number(cart.deliveryFee || 0),
      serviceFee: Number(cart.serviceFee || 0),
      total: Number(cart.total),
      items,
    };
  }

  /**
   * Get all active carts for a user
   */
  async getUserCarts(userId: string) {
    return prisma.cart.findMany({
      where: {
        userId,
        status: 'active',
      },
      include: {
        platform: true,
        store: true,
        restaurant: true,
        items: {
          include: {
            product: true,
            menuItem: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Clear cart
   */
  async clearCart(cartId: string) {
    await prisma.cartItem.deleteMany({
      where: { cartId },
    });

    await prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal: 0,
        deliveryFee: 0,
        serviceFee: 0,
        total: 0,
      },
    });
  }

  /**
   * Complete cart (mark as completed)
   */
  async completeCart(cartId: string) {
    return prisma.cart.update({
      where: { id: cartId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Cancel cart
   */
  async cancelCart(cartId: string) {
    return prisma.cart.update({
      where: { id: cartId },
      data: {
        status: 'cancelled',
      },
    });
  }
}

export const cartService = new CartService();
