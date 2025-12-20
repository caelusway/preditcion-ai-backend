import { prisma } from '../lib/prisma';
import { AppError } from '../types/common.types';
import { logger } from '../lib/logger';

interface CreateCouponInput {
  name?: string;
  currency?: string;
  stake?: number;
}

interface UpdateCouponInput {
  name?: string;
  status?: 'active' | 'completed';
  currency?: string;
  stake?: number;
}

interface AddSelectionInput {
  matchApiId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogoUrl?: string;
  awayTeamLogoUrl?: string;
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
   * Get past coupons (completed)
   */
  async getPastCoupons(userId: string) {
    return await prisma.coupon.findMany({
      where: {
        userId,
        status: 'completed',
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
        result: 'pending',
        totalOdds: 1.0,
        currency: data.currency || 'TRY',
        stake: data.stake,
        potentialWin: data.stake ? data.stake * 1.0 : null,
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
   * Update/Save a coupon
   */
  async updateCoupon(userId: string, couponId: string, data: UpdateCouponInput) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        userId,
      },
    });

    if (!coupon) {
      throw new AppError(404, 'Coupon not found');
    }

    // Calculate potentialWin if stake is updated
    const newStake = data.stake !== undefined ? data.stake : coupon.stake;
    const totalOdds = coupon.totalOdds || 1.0;
    const potentialWin = newStake ? newStake * totalOdds : coupon.potentialWin;

    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        name: data.name !== undefined ? data.name : coupon.name,
        status: data.status !== undefined ? data.status : coupon.status,
        currency: data.currency !== undefined ? data.currency : coupon.currency,
        stake: newStake,
        potentialWin,
      },
      include: {
        selections: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    logger.info({ userId, couponId, status: updatedCoupon.status }, 'Coupon updated');
    return updatedCoupon;
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

    if (coupon.status === 'completed') {
      throw new AppError(400, 'Cannot add selections to a completed coupon');
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
        homeTeamLogoUrl: data.homeTeamLogoUrl ?? null,
        awayTeamLogoUrl: data.awayTeamLogoUrl ?? null,
        kickoffTime: new Date(data.kickoffTime),
        league: data.league,
        predictionType: data.predictionType,
        prediction: data.prediction,
        odds: data.odds,
      },
    });

    // Recalculate total odds and potential win
    const allSelections = [...coupon.selections, selection];
    const totalOdds = allSelections.reduce((acc, s) => acc * s.odds, 1);
    const potentialWin = coupon.stake ? coupon.stake * totalOdds : null;

    await prisma.coupon.update({
      where: { id: couponId },
      data: { totalOdds, potentialWin },
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

    if (coupon.status === 'completed') {
      throw new AppError(400, 'Cannot modify a completed coupon');
    }

    const selection = coupon.selections.find(s => s.id === selectionId);
    if (!selection) {
      throw new AppError(404, 'Selection not found in this coupon');
    }

    await prisma.couponSelection.delete({
      where: { id: selectionId },
    });

    // Recalculate total odds and potential win
    const remainingSelections = coupon.selections.filter(s => s.id !== selectionId);
    const totalOdds = remainingSelections.length > 0
      ? remainingSelections.reduce((acc, s) => acc * s.odds, 1)
      : 1.0;
    const potentialWin = coupon.stake ? coupon.stake * totalOdds : null;

    await prisma.coupon.update({
      where: { id: couponId },
      data: { totalOdds, potentialWin },
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

    // Calculate result
    const result = this.calculateResult(coupon.selections);

    // Update coupon status and result
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        status: 'completed',
        result,
      },
    });

    return await this.getCouponById(userId, couponId);
  }

  /**
   * Calculate coupon result based on selections
   */
  private calculateResult(selections: any[]): string {
    if (selections.length === 0) {
      return 'pending';
    }

    const results = selections.map(s => s.result);

    // If any selection is still pending (null), coupon is pending
    if (results.some(r => r === null)) {
      return 'pending';
    }

    // If any selection is lost, coupon is lost
    if (results.some(r => r === 'lost')) {
      return 'lost';
    }

    // If any selection is void, it's partial (some void, rest won)
    if (results.some(r => r === 'void')) {
      return 'partial';
    }

    // All selections won
    if (results.every(r => r === 'won')) {
      return 'won';
    }

    return 'pending';
  }

  /**
   * Calculate selection result based on match result and prediction
   */
  private calculateSelectionResult(
    prediction: string,
    predictionType: string,
    homeScore: number,
    awayScore: number
  ): 'won' | 'lost' {
    const totalGoals = homeScore + awayScore;
    const bothTeamsScored = homeScore > 0 && awayScore > 0;

    switch (predictionType) {
      case '1x2':
        if (prediction === '1') {
          return homeScore > awayScore ? 'won' : 'lost';
        } else if (prediction === 'X') {
          return homeScore === awayScore ? 'won' : 'lost';
        } else if (prediction === '2') {
          return awayScore > homeScore ? 'won' : 'lost';
        }
        break;

      case 'btts':
        if (prediction === 'Yes' || prediction === 'yes') {
          return bothTeamsScored ? 'won' : 'lost';
        } else if (prediction === 'No' || prediction === 'no') {
          return !bothTeamsScored ? 'won' : 'lost';
        }
        break;

      case 'over_under':
        const overUnderMatch = prediction.match(/(Over|Under)\s*(\d+\.?\d*)/i);
        if (overUnderMatch) {
          const isOver = overUnderMatch[1].toLowerCase() === 'over';
          const threshold = parseFloat(overUnderMatch[2]);
          if (isOver) {
            return totalGoals > threshold ? 'won' : 'lost';
          } else {
            return totalGoals < threshold ? 'won' : 'lost';
          }
        }
        break;

      case 'double_chance':
        if (prediction === '1X') {
          return homeScore >= awayScore ? 'won' : 'lost';
        } else if (prediction === 'X2') {
          return awayScore >= homeScore ? 'won' : 'lost';
        } else if (prediction === '12') {
          return homeScore !== awayScore ? 'won' : 'lost';
        }
        break;
    }

    return 'lost'; // Default to lost if prediction type is unknown
  }

  /**
   * Update all selections for finished matches and recalculate coupon results
   * This should be called after syncing finished matches
   */
  async updateAllCouponResults() {
    // First, link any unlinked selections to their matches
    const unlinkedSelections = await prisma.couponSelection.findMany({
      where: {
        matchId: null,
      },
    });

    if (unlinkedSelections.length > 0) {
      logger.info({ count: unlinkedSelections.length }, 'Found unlinked selections, linking to matches');
    }

    for (const selection of unlinkedSelections) {
      const match = await prisma.match.findFirst({
        where: { apiId: selection.matchApiId },
      });

      if (match) {
        await prisma.couponSelection.update({
          where: { id: selection.id },
          data: { matchId: match.id },
        });
        logger.info({ selectionId: selection.id, matchId: match.id }, 'Linked selection to match');
      }
    }

    // Find all selections with finished matches that don't have a result yet
    const pendingSelections = await prisma.couponSelection.findMany({
      where: {
        result: null,
        match: {
          status: 'finished',
        },
      },
      include: {
        match: true,
        coupon: true,
      },
    });

    logger.info({ count: pendingSelections.length }, 'Updating pending coupon selections');

    const affectedCouponIds = new Set<string>();

    for (const selection of pendingSelections) {
      if (!selection.match || selection.match.homeScore === null || selection.match.awayScore === null) {
        continue;
      }

      const result = this.calculateSelectionResult(
        selection.prediction,
        selection.predictionType,
        selection.match.homeScore,
        selection.match.awayScore
      );

      await prisma.couponSelection.update({
        where: { id: selection.id },
        data: { result },
      });

      affectedCouponIds.add(selection.couponId);
      logger.info({
        selectionId: selection.id,
        matchApiId: selection.matchApiId,
        prediction: selection.prediction,
        predictionType: selection.predictionType,
        result,
      }, 'Selection result updated');
    }

    // Update affected coupons
    for (const couponId of affectedCouponIds) {
      await this.updateCouponResults(couponId);
    }

    return {
      selectionsUpdated: pendingSelections.length,
      couponsUpdated: affectedCouponIds.size,
    };
  }

  /**
   * Update coupon status and result based on match results
   * This should be called when matches are finished
   */
  async updateCouponResults(couponId: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        selections: {
          include: {
            match: true,
          },
        },
      },
    });

    if (!coupon) {
      return null;
    }

    // Check if all matches are finished
    const allMatchesFinished = coupon.selections.length > 0 && coupon.selections.every(s => {
      if (!s.match) return false;
      return s.match.status === 'finished';
    });

    // Calculate result
    const result = this.calculateResult(coupon.selections);

    // Determine status
    const status = allMatchesFinished ? 'completed' : 'active';

    // Update coupon
    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        status,
        result,
      },
      include: {
        selections: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    logger.info({ couponId, status, result }, 'Coupon results updated');
    return updatedCoupon;
  }

  /**
   * Get coupons with calculated status (for display purposes)
   * Enriches coupons with real-time result calculation
   */
  async getCouponsWithStatus(userId: string) {
    const coupons = await prisma.coupon.findMany({
      where: { userId },
      include: {
        selections: {
          include: {
            match: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with calculated results
    return coupons.map(coupon => {
      const calculatedResult = this.calculateResult(coupon.selections);
      const allMatchesFinished = coupon.selections.every(s => {
        if (!s.match) return false;
        return s.match.status === 'finished';
      });

      return {
        ...coupon,
        result: coupon.result || calculatedResult,
        status: allMatchesFinished ? 'completed' : coupon.status,
        selectionsCount: coupon.selections.length,
        wonCount: coupon.selections.filter(s => s.result === 'won').length,
        lostCount: coupon.selections.filter(s => s.result === 'lost').length,
        pendingCount: coupon.selections.filter(s => s.result === null).length,
      };
    });
  }
}

export const couponService = new CouponService();
