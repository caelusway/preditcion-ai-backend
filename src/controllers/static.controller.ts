import { Request, Response, NextFunction } from 'express';
import {
  bettingTips,
  navigation,
  faq,
  settings,
  onboarding,
  homeStats,
  dateFilters,
  matchTypeFilters,
  timeFilters,
  confidenceLevels,
  staticData,
} from '../data/static.dummy';
import { standings } from '../data/match-detail.dummy';

export class StaticController {
  // GET /static - Get all static data
  async getAllStaticData(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(staticData);
    } catch (error) {
      next(error);
    }
  }

  // GET /static/betting-tips - Get betting tips
  async getBettingTips(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ bettingTips });
    } catch (error) {
      next(error);
    }
  }

  // GET /static/navigation - Get navigation menu items
  async getNavigation(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(navigation);
    } catch (error) {
      next(error);
    }
  }

  // GET /static/faq - Get FAQ data
  async getFaq(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(faq);
    } catch (error) {
      next(error);
    }
  }

  // GET /static/settings - Get settings options
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(settings);
    } catch (error) {
      next(error);
    }
  }

  // GET /static/onboarding - Get onboarding screens
  async getOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(onboarding);
    } catch (error) {
      next(error);
    }
  }

  // GET /static/home-stats - Get home stats
  async getHomeStats(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(homeStats);
    } catch (error) {
      next(error);
    }
  }

  // GET /static/filters - Get all filter options
  async getFilters(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        dateFilters,
        matchTypeFilters,
        timeFilters,
        confidenceLevels,
      });
    } catch (error) {
      next(error);
    }
  }
}

export class LeaguesController {
  // GET /leagues/:id/standings - Get league standings
  async getStandings(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // For now, return the default standings
      // In production, this would fetch from database based on league ID
      res.status(200).json({
        leagueId: id,
        standings,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const staticController = new StaticController();
export const leaguesController = new LeaguesController();




