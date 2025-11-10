import { Request, Response, NextFunction } from 'express';
import { userStatsService } from '../services/user-stats.service';

export class UserStatsController {
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await userStatsService.getUserStats(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const userStatsController = new UserStatsController();
