import { prisma } from '../lib/prisma';
import { AppError } from '../types/common.types';
import { logger } from '../lib/logger';

interface CreateCouponInput {
  name?: string;
}

interface AddSelectionInput {
  matchApiId: string;
  homeTeamName: string;
  awayTeamName: string;
  kickoffTime: string;
  league: string;
  predictionType: string;
  prediction: string;
  odds: number;
}

export class CouponService {
  /**
   * Get all coupons for a user
   */
  async getCoupons(userId: string) {
    return await prisma.coupon.findMany({
      where: { userId },
      include: {
        selections: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get active coupon (most recent non-settled)
   */
  async getActiveCoupon(userId: string) {
    return await prisma.coupon.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: {
        selections: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get past coupons (settled or cancelled)
   */
  async getPastCoupons(userId: string) {
    return await prisma.coupon.findMany({
      where: {
        userId,
        status: { in: ['settled', 'cancelled'] },
      },
      include: {
        selections: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get coupon by ID
   */
  async getCouponById(userId: string, couponId: string) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        userId,
      },
      include: {
        selections: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!coupon) {
      throw new AppError(404, 'Coupon not found');
    }

    return coupon;
  }

  /**
   * Create a new coupon
   */
  async createCoupon(userId: string, data: CreateCouponInput) {
    const coupon = await prisma.coupon.create({
      data: {
        userId,
        name: data.name,
        status: 'active',
        totalOdds: 1.0,
      },
      include: {
        selections: true,
      },
    });

    logger.info({ userId, couponId: coupon.id }, 'Coupon created');
    return coupon;
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(userId: string, couponId: string) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        userId,
      },
    });

    if (!coupon) {
      throw new AppError(404, 'Coupon not found');
    }

    await prisma.coupon.delete({
      where: { id: couponId },
    });

    logger.info({ userId, couponId }, 'Coupon deleted');
    return { message: 'Coupon deleted successfully' };
  }

  /**
   * Add a selection (match prediction) to a coupon
   */
  async addSelection(userId: string, couponId: string, data: AddSelectionInput) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        userId,
      },
      include: {
        selections: true,
      },
    });

    if (!coupon) {
      throw new AppError(404, 'Coupon not found');
    }

    if (coupon.status !== 'active') {
      throw new AppError(400, 'Cannot add selections to a non-active coupon');
    }

    // Check if selection for this match already exists
    const existingSelection = coupon.selections.find(
      s => s.matchApiId === data.matchApiId
    );

    if (existingSelection) {
      throw new AppError(409, 'This match is already in the coupon');
    }

    // Try to find the match in database
    const match = await prisma.match.findFirst({
      where: { apiId: data.matchApiId },
    });

    // Create the selection
    const selection = await prisma.couponSelection.create({
      data: {
        couponId,
        matchId: match?.id,
        matchApiId: data.matchApiId,
        homeTeamName: data.homeTeamName,
        awayTeamName: data.awayTeamName,
        kickoffTime: new Date(data.kickoffTime),
        league: data.league,
        predictionType: data.predictionType,
        prediction: data.prediction,
        odds: data.odds,
      },
    });

    // Recalculate total odds
    const allSelections = [...coupon.selections, selection];
    const totalOdds = allSelections.reduce((acc, s) => acc * s.odds, 1);

    await prisma.coupon.update({
      where: { id: couponId },
      data: { totalOdds },
    });

    // Return updated coupon
    return await this.getCouponById(userId, couponId);
  }

  /**
   * Remove a selection from a coupon
   */
  async removeSelection(userId: string, couponId: string, selectionId: string) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        userId,
      },
      include: {
        selections: true,
      },
    });

    if (!coupon) {
      throw new AppError(404, 'Coupon not found');
    }

    if (coupon.status !== 'active') {
      throw new AppError(400, 'Cannot modify a non-active coupon');
    }

    const selection = coupon.selections.find(s => s.id === selectionId);
    if (!selection) {
      throw new AppError(404, 'Selection not found in this coupon');
    }

    await prisma.couponSelection.delete({
      where: { id: selectionId },
    });

    // Recalculate total odds
    const remainingSelections = coupon.selections.filter(s => s.id !== selectionId);
    const totalOdds = remainingSelections.length > 0
      ? remainingSelections.reduce((acc, s) => acc * s.odds, 1)
      : 1.0;

    await prisma.coupon.update({
      where: { id: couponId },
      data: { totalOdds },
    });

    // Return updated coupon
    return await this.getCouponById(userId, couponId);
  }

  /**
   * Settle a coupon (calculate results)
   */
  async settleCoupon(userId: string, couponId: string) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        userId,
      },
      include: {
        selections: {
          include: {
            match: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new AppError(404, 'Coupon not found');
    }

    // Update coupon status
    await prisma.coupon.update({
      where: { id: couponId },
      data: { status: 'settled' },
    });

    return await this.getCouponById(userId, couponId);
  }
}

export const couponService = new CouponService();
