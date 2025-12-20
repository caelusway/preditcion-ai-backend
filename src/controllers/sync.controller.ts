import { Request, Response, NextFunction } from 'express';
import { schedulerService } from '../services/scheduler.service';
import { matchSyncService } from '../services/match-sync.service';

export class SyncController {
  /**
   * GET /sync/status - Get sync status
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await schedulerService.getStatus();
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /sync/trigger - Manually trigger a sync
   */
  async triggerSync(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await schedulerService.triggerSync();
      res.status(200).json({
        message: 'Sync completed successfully',
        result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Sync already in progress') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Sync already in progress',
        });
      }
      next(error);
    }
  }

  /**
   * POST /sync/fixtures - Sync upcoming fixtures only
   */
  async syncFixtures(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const result = await matchSyncService.syncUpcomingFixtures(days);
      res.status(200).json({
        message: 'Fixtures sync completed',
        result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /sync/odds - Sync odds for upcoming matches
   */
  async syncOdds(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await matchSyncService.syncOddsForUpcomingMatches();
      res.status(200).json({
        message: 'Odds sync completed',
        result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /sync/finished - Sync finished matches
   */
  async syncFinished(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const result = await matchSyncService.syncFinishedMatches(days);
      res.status(200).json({
        message: 'Finished matches sync completed',
        result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /sync/teams - Sync teams for all leagues
   */
  async syncTeams(req: Request, res: Response, next: NextFunction) {
    try {
      await matchSyncService.syncTeamsForAllLeagues();
      res.status(200).json({
        message: 'Teams sync completed',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const syncController = new SyncController();
