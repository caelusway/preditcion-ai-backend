import { Request, Response, NextFunction } from 'express';
import {
  dummyAccuracyWeek,
  dummyAccuracyMonth,
  dummyTopTeams,
  dummyTopTeamsLegacy,
  dummyConfidenceDistribution,
  dummySurprises,
  insights,
} from '../data/insights.dummy';

export class InsightsController {
  // GET /insights/accuracy - Get prediction accuracy trends
  async getAccuracy(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || 'week';

      const data = period === 'month' ? dummyAccuracyMonth : dummyAccuracyWeek;

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  // GET /insights/top-teams - Get top performing teams
  async getTopTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const format = req.query.format as string; // 'legacy' for old format

      if (format === 'legacy') {
        const teams = dummyTopTeamsLegacy.slice(0, limit);
        return res.status(200).json({ teams });
      }

      const teams = dummyTopTeams.slice(0, limit);

      res.status(200).json({ teams });
    } catch (error) {
      next(error);
    }
  }

  // GET /insights/confidence-distribution - Get confidence level distribution
  async getConfidenceDistribution(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.status(200).json({ distribution: dummyConfidenceDistribution });
    } catch (error) {
      next(error);
    }
  }

  // GET /insights/surprises - Get surprise match results
  async getSurprises(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const surprises = dummySurprises.slice(0, limit);

      res.status(200).json({ surprises });
    } catch (error) {
      next(error);
    }
  }

  // GET /insights - Get all insights data
  async getAllInsights(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(insights);
    } catch (error) {
      next(error);
    }
  }
}

export const insightsController = new InsightsController();
