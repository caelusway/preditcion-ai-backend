import { prisma } from '../lib/prisma';
import { AppError } from '../types/common.types';
import { logger } from '../lib/logger';

export class UserStatsService {
  async getUserStats(userId: string) {
    // Get or create user stats
    let stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await prisma.userStats.create({
        data: { userId },
      });
    }

    // Get additional calculated data
    const savedMatchesCount = await prisma.savedMatch.count({
      where: { userId },
    });

    return {
      ...stats,
      savedMatchesCount,
    };
  }

  async initializeStats(userId: string) {
    // Create stats if they don't exist
    const existing = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    const stats = await prisma.userStats.create({
      data: { userId },
    });

    logger.info({ userId }, 'User stats initialized');

    return stats;
  }

  async updatePredictionStats(
    userId: string,
    correct: boolean
  ) {
    let stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await this.initializeStats(userId);
    }

    const totalPredictions = stats.totalPredictions + 1;
    const correctPredictions = correct
      ? stats.correctPredictions + 1
      : stats.correctPredictions;
    const wrongPredictions = correct
      ? stats.wrongPredictions
      : stats.wrongPredictions + 1;

    const accuracyRate = (correctPredictions / totalPredictions) * 100;

    // Update streak
    let currentStreak = correct ? stats.currentStreak + 1 : 0;
    let longestStreak = Math.max(stats.longestStreak, currentStreak);

    const updatedStats = await prisma.userStats.update({
      where: { userId },
      data: {
        totalPredictions,
        correctPredictions,
        wrongPredictions,
        accuracyRate,
        currentStreak,
        longestStreak,
        lastPredictionAt: new Date(),
        lastActive: new Date(),
      },
    });

    logger.info({ userId, correct, accuracyRate }, 'User prediction stats updated');

    return updatedStats;
  }

  async incrementMatchesWatched(userId: string) {
    let stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await this.initializeStats(userId);
    }

    const updatedStats = await prisma.userStats.update({
      where: { userId },
      data: {
        totalMatchesWatched: stats.totalMatchesWatched + 1,
        lastActive: new Date(),
      },
    });

    return updatedStats;
  }

  async updateLastActive(userId: string) {
    let stats = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await this.initializeStats(userId);
    } else {
      await prisma.userStats.update({
        where: { userId },
        data: { lastActive: new Date() },
      });
    }
  }
}

export const userStatsService = new UserStatsService();
