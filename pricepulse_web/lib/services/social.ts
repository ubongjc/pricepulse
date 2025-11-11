import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Social Features Service
 * Manages deals, likes, comments, and community interactions
 */
export class SocialService {
  /**
   * Create a new deal
   */
  async createDeal(
    userId: string,
    data: {
      productId: string;
      storeId: string;
      price: number;
      regularPrice?: number;
      description?: string;
      imageUrl?: string;
      expiresAt?: Date;
    }
  ) {
    const savings = data.regularPrice
      ? data.regularPrice - data.price
      : undefined;

    const deal = await prisma.deal.create({
      data: {
        userId,
        productId: data.productId,
        storeId: data.storeId,
        price: data.price,
        regularPrice: data.regularPrice,
        savings,
        description: data.description,
        imageUrl: data.imageUrl,
        expiresAt: data.expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        store: true,
      },
    });

    return deal;
  }

  /**
   * Get community deals feed
   */
  async getDealsFeed(options: {
    userId?: string;
    storeId?: string;
    productId?: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, storeId, productId, limit = 20, offset = 0 } = options;

    const deals = await prisma.deal.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
        ...(userId && { userId }),
        ...(storeId && { storeId }),
        ...(productId && { productId }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        store: true,
        likes: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return deals;
  }

  /**
   * Get a single deal by ID
   */
  async getDeal(dealId: string) {
    return prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        store: true,
        likes: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        verifications: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Like a deal
   */
  async likeDeal(userId: string, dealId: string) {
    try {
      const like = await prisma.dealLike.create({
        data: { userId, dealId },
      });

      // Update like count
      await prisma.deal.update({
        where: { id: dealId },
        data: { likeCount: { increment: 1 } },
      });

      return { success: true, like };
    } catch (error) {
      // Already liked (unique constraint)
      return { success: false, message: 'Already liked' };
    }
  }

  /**
   * Unlike a deal
   */
  async unlikeDeal(userId: string, dealId: string) {
    try {
      await prisma.dealLike.delete({
        where: { userId_dealId: { userId, dealId } },
      });

      // Update like count
      await prisma.deal.update({
        where: { id: dealId },
        data: { likeCount: { decrement: 1 } },
      });

      return { success: true };
    } catch (error) {
      return { success: false, message: 'Like not found' };
    }
  }

  /**
   * Comment on a deal
   */
  async commentOnDeal(userId: string, dealId: string, content: string) {
    const comment = await prisma.dealComment.create({
      data: {
        userId,
        dealId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update comment count
    await prisma.deal.update({
      where: { id: dealId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.dealComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.dealComment.delete({
      where: { id: commentId },
    });

    // Update comment count
    await prisma.deal.update({
      where: { id: comment.dealId },
      data: { commentCount: { decrement: 1 } },
    });

    return { success: true };
  }

  /**
   * Verify a deal
   */
  async verifyDeal(userId: string, dealId: string, isVerified: boolean) {
    try {
      const verification = await prisma.dealVerification.create({
        data: {
          userId,
          dealId,
          isVerified,
        },
      });

      // Count verifications
      const verifications = await prisma.dealVerification.findMany({
        where: { dealId },
      });

      const positiveCount = verifications.filter((v) => v.isVerified).length;
      const totalCount = verifications.length;

      // Update deal verification status
      const deal = await prisma.deal.update({
        where: { id: dealId },
        data: {
          verifiedBy: totalCount,
          verified: positiveCount >= 3, // Verified if 3+ positive verifications
        },
      });

      return { success: true, verification, deal };
    } catch (error) {
      // Already verified (unique constraint)
      return { success: false, message: 'Already verified' };
    }
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    try {
      const follow = await prisma.userFollow.create({
        data: { followerId, followingId },
      });

      return { success: true, follow };
    } catch (error) {
      return { success: false, message: 'Already following' };
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string) {
    try {
      await prisma.userFollow.delete({
        where: {
          followerId_followingId: { followerId, followingId },
        },
      });

      return { success: true };
    } catch (error) {
      return { success: false, message: 'Not following' };
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers(userId: string) {
    return prisma.userFollow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string) {
    return prisma.userFollow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get top deal contributors (leaderboard)
   */
  async getTopContributors(limit: number = 10) {
    const topUsers = await prisma.deal.groupBy({
      by: ['userId'],
      where: {
        isActive: true,
        verified: true,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const userIds = topUsers.map((u) => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return topUsers.map((u) => ({
      user: userMap.get(u.userId),
      dealCount: u._count.id,
    }));
  }

  /**
   * Get trending deals (most liked/commented in last 7 days)
   */
  async getTrendingDeals(limit: number = 10) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return prisma.deal.findMany({
      where: {
        isActive: true,
        createdAt: { gte: sevenDaysAgo },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        store: true,
      },
      orderBy: [
        { likeCount: 'desc' },
        { commentCount: 'desc' },
      ],
      take: limit,
    });
  }
}

export const socialService = new SocialService();
