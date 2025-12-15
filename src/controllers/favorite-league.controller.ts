import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../types/common.types';

export class FavoriteLeagueController {
  /**
   * GET /me/favorite-leagues - Get user's favorite leagues
   */
  async getFavoriteLeagues(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const favoriteLeagues = await prisma.favoriteLeague.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json({ favoriteLeagues });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /me/favorite-leagues - Add a league to favorites
   */
  async addFavoriteLeague(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { leagueId, leagueName, country, logoUrl } = req.body;

      if (!leagueId || !leagueName || !country) {
        throw new AppError(400, 'leagueId, leagueName, and country are required');
      }

      // Check if already exists
      const existing = await prisma.favoriteLeague.findUnique({
        where: {
          userId_leagueId: { userId, leagueId: parseInt(leagueId) },
        },
      });

      if (existing) {
        throw new AppError(409, 'League is already in favorites');
      }

      const favoriteLeague = await prisma.favoriteLeague.create({
        data: {
          userId,
          leagueId: parseInt(leagueId),
          leagueName,
          country,
          logoUrl,
        },
      });

      res.status(201).json({ favoriteLeague });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /me/favorite-leagues/:leagueId - Remove a league from favorites
   */
  async removeFavoriteLeague(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const leagueId = parseInt(req.params.leagueId);

      if (isNaN(leagueId)) {
        throw new AppError(400, 'Invalid league ID');
      }

      const existing = await prisma.favoriteLeague.findUnique({
        where: {
          userId_leagueId: { userId, leagueId },
        },
      });

      if (!existing) {
        throw new AppError(404, 'League not found in favorites');
      }

      await prisma.favoriteLeague.delete({
        where: {
          userId_leagueId: { userId, leagueId },
        },
      });

      res.status(200).json({ message: 'League removed from favorites' });
    } catch (error) {
      next(error);
    }
  }
}

export const favoriteLeagueController = new FavoriteLeagueController();
