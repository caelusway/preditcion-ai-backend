import { Request, Response, NextFunction } from 'express';
import { dummyMatches, dummyMatchDetails, homeStats } from '../data/matches.dummy';
import {
  matchStatistics,
  formStatistics,
  homeTeamRecentMatches,
  awayTeamRecentMatches,
  standings,
  aiPredictions,
  matchHeaderOdds,
  marketValues,
  scorePredictions,
  statsPredictions,
  getMatchDetailData,
} from '../data/match-detail.dummy';
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
  // GET /matches - Get all matches (paginated)
  async getMatches(req: Request, res: Response, next: NextFunction) {
    try {
      // If using dummy data, return mock response
      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const date = req.query.date as string; // yesterday, today, tomorrow

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
            hasPreviousPage: false,
          },
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

  // GET /matches/upcoming - Get upcoming matches
  async getUpcomingMatches(req: Request, res: Response, next: NextFunction) {
    try {
      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        const matches = dummyMatches.filter((m) => m.status === 'upcoming');
        return res.status(200).json({
          data: matches,
          count: matches.length,
        });
      }

      const matches = await prisma.match.findMany({
        where: { status: 'upcoming' },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: {
          kickoffTime: 'asc',
        },
        take: 20,
      });

      return res.status(200).json({
        data: matches,
        count: matches.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/:id - Get match details with prediction
  async getMatchById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // If using dummy data
      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        const matchDetail = dummyMatchDetails[id];
        if (matchDetail) {
          return res.status(200).json(matchDetail);
        }

        // Fallback to basic match
        const match = dummyMatches.find((m) => m.id === id);
        if (!match) {
          throw new AppError(404, 'Match not found');
        }

        return res.status(200).json(match);
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

  // GET /matches/:id/predictions - Get AI predictions for match
  async getMatchPredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        const matchDetail = dummyMatchDetails[id];
        if (matchDetail) {
          return res.status(200).json({
            prediction: matchDetail.prediction,
            aiPredictions,
            matchHeaderOdds,
            scorePredictions,
            statsPredictions,
          });
        }
        throw new AppError(404, 'Match not found');
      }

      const match = await prisma.match.findUnique({
        where: { id },
        include: {
          predictions: {
            where: { userId: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!match) {
        throw new AppError(404, 'Match not found');
      }

      return res.status(200).json({
        predictions: match.predictions,
        aiPredictions,
        matchHeaderOdds,
        scorePredictions,
        statsPredictions,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/:id/statistics - Get match statistics
  async getMatchStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        return res.status(200).json({
          matchId: id,
          statistics: matchStatistics,
        });
      }

      const stats = await prisma.matchStatistics.findUnique({
        where: { matchId: id },
      });

      if (!stats) {
        // Return default statistics if none found
        return res.status(200).json({
          matchId: id,
          statistics: matchStatistics,
        });
      }

      return res.status(200).json({
        matchId: id,
        statistics: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/:id/form - Get team form data
  async getMatchForm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        return res.status(200).json({
          matchId: id,
          formStatistics,
          marketValues,
        });
      }

      // In production, fetch from database
      return res.status(200).json({
        matchId: id,
        formStatistics,
        marketValues,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/:id/recent - Get recent matches for teams
  async getRecentMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (env.FOOTBALL_DATA_SOURCE === 'dummy') {
        return res.status(200).json({
          matchId: id,
          homeTeamRecentMatches,
          awayTeamRecentMatches,
        });
      }

      // In production, fetch from database
      return res.status(200).json({
        matchId: id,
        homeTeamRecentMatches,
        awayTeamRecentMatches,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /matches/home-stats - Get home stats
  async getHomeStats(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json(homeStats);
    } catch (error) {
      next(error);
    }
  }
}

export const matchesController = new MatchesController();
