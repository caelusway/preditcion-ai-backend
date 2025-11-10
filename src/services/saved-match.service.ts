import { prisma } from '../lib/prisma';
import { AppError } from '../types/common.types';
import { logger } from '../lib/logger';
import { env } from '../config/env';
import { dummyMatches } from '../data/matches.dummy';

export class SavedMatchService {
  async saveMatch(userId: string, matchId: string, teamId?: string, notes?: string) {
    // Check if match exists
    if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
      // For dummy data, just check if matchId exists in dummy data
      const match = dummyMatches.find(m => m.id === matchId);
      if (!match) {
        throw new AppError(404, 'Match not found');
      }
    } else {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        throw new AppError(404, 'Match not found');
      }

      // Validate teamId if provided
      if (teamId && teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
        throw new AppError(400, 'Team is not part of this match');
      }
    }

    // Check if already saved
    const existing = await prisma.savedMatch.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
    });

    if (existing) {
      throw new AppError(409, 'Match already saved');
    }

    // Save the match
    const savedMatch = await prisma.savedMatch.create({
      data: {
        userId,
        matchId,
        teamId,
        notes,
      },
    });

    logger.info({ userId, matchId }, 'Match saved by user');

    // Return with match data if using database, simple response for dummy
    if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
      return {
        ...savedMatch,
        match: dummyMatches.find(m => m.id === matchId)
      };
    }

    // For database, fetch full match data
    const fullSavedMatch = await prisma.savedMatch.findUnique({
      where: { id: savedMatch.id },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            predictions: {
              where: { userId: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    return fullSavedMatch;
  }

  async unsaveMatch(userId: string, matchId: string) {
    const savedMatch = await prisma.savedMatch.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
    });

    if (!savedMatch) {
      throw new AppError(404, 'Saved match not found');
    }

    await prisma.savedMatch.delete({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
    });

    logger.info({ userId, matchId }, 'Match unsaved by user');

    return { message: 'Match removed from saved matches' };
  }

  async getSavedMatches(userId: string, status?: string) {
    const where: any = { userId };

    if (status) {
      where.match = { status };
    }

    const savedMatches = await prisma.savedMatch.findMany({
      where,
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            predictions: {
              where: { userId: null }, // AI predictions only
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        team: true,
      },
      orderBy: {
        match: {
          kickoffTime: 'asc',
        },
      },
    });

    return savedMatches;
  }

  async checkIfSaved(userId: string, matchId: string) {
    const savedMatch = await prisma.savedMatch.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
    });

    return {
      saved: !!savedMatch,
      savedAt: savedMatch?.createdAt,
    };
  }
}

export const savedMatchService = new SavedMatchService();
