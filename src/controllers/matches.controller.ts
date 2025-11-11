import { Request, Response, NextFunction } from 'express';
import { dummyMatches, dummyPredictions } from '../data/matches.dummy';
import { AppError } from '../types/common.types';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import {
  parsePaginationParams,
  getPrismaPagination,
  createPaginatedResponse,
} from '../utils/pagination';
import { generatePrediction } from '../utils/generate-prediction';

export class MatchesController {
  async getMatches(req: Request, res: Response, next: NextFunction) {
    try {
      // If using dummy data, return simple response
      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;

        let matches = [...dummyMatches];

        if (status) {
          matches = matches.filter((m) => m.status === status);
        }

        matches = matches.slice(0, limit);
        return res.status(200).json({
          data: matches,
          pagination: {
            currentPage: 1,
            itemsPerPage: matches.length,
            totalItems: matches.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          }
        });
      }

      // Using database with proper pagination
      const { page, limit, skip } = parsePaginationParams(req);
      const status = req.query.status as string;

      // Build where clause
      const where: any = {};
      if (status) {
        where.status = status;
      }

      // Get total count and matches in parallel
      const [totalCount, matches] = await Promise.all([
        prisma.match.count({ where }),
        prisma.match.findMany({
          where,
          include: {
            homeTeam: true,
            awayTeam: true,
          },
          orderBy: {
            kickoffTime: 'asc',
          },
          ...getPrismaPagination({ page, limit, skip }),
        }),
      ]);

      // Return paginated response
      const response = createPaginatedResponse(matches, page, limit, totalCount);

      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getMatchById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // If using dummy data
      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        const match = dummyMatches.find((m) => m.id === id);
        if (!match) {
          throw new AppError(404, 'Match not found');
        }

        const prediction = dummyPredictions[id];
        if (!prediction) {
          throw new AppError(404, 'Prediction not found for this match');
        }

        return res.status(200).json({
          ...match,
          prediction,
        });
      }

      // Using real database - fetch match with teams and predictions
      const match = await prisma.match.findUnique({
        where: { id },
        include: {
          homeTeam: true,
          awayTeam: true,
          predictions: {
            where: { userId: null }, // AI predictions only
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!match) {
        throw new AppError(404, 'Match not found');
      }

      // Use stored prediction if available, otherwise generate dynamically
      let prediction;
      if (match.predictions && match.predictions.length > 0) {
        const dbPrediction = match.predictions[0];
        prediction = {
          id: dbPrediction.id,
          homeWinProbability: dbPrediction.homeWinProbability,
          drawProbability: dbPrediction.drawProbability,
          awayWinProbability: dbPrediction.awayWinProbability,
          aiConfidence: dbPrediction.confidence,
          aiAnalysis: dbPrediction.reasoning,
          quickStats: dbPrediction.factors,
        };
      } else {
        // Fallback: generate prediction dynamically
        prediction = generatePrediction(
          { id: match.homeTeam.id, name: match.homeTeam.name },
          { id: match.awayTeam.id, name: match.awayTeam.name }
        );
        prediction.id = `pred-${match.id}`;
      }

      return res.status(200).json({
        ...match,
        prediction,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const matchesController = new MatchesController();
