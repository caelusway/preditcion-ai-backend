import { Request, Response, NextFunction } from 'express';
import {
  dummyAccuracyWeek,
  dummyAccuracyMonth,
  dummyTopTeams,
  dummyConfidenceDistribution,
} from '../data/insights.dummy';

export class InsightsController {
  async getAccuracy(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || 'week';

      const data = period === 'month' ? dummyAccuracyMonth : dummyAccuracyWeek;

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async getTopTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;

      const teams = dummyTopTeams.teams.slice(0, limit);

      res.status(200).json({ teams });
    } catch (error) {
      next(error);
    }
  }

  async getConfidenceDistribution(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.status(200).json(dummyConfidenceDistribution);
    } catch (error) {
      next(error);
    }
  }
}

export const insightsController = new InsightsController();
