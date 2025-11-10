import { Request, Response, NextFunction } from 'express';
import { savedMatchService } from '../services/saved-match.service';

export class SavedMatchController {
  async saveMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { matchId, teamId, notes } = req.body;

      const result = await savedMatchService.saveMatch(userId, matchId, teamId, notes);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unsaveMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { matchId } = req.params;

      const result = await savedMatchService.unsaveMatch(userId, matchId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSavedMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { status } = req.query;

      const result = await savedMatchService.getSavedMatches(
        userId,
        status as string | undefined
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async checkIfSaved(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { matchId } = req.params;

      const result = await savedMatchService.checkIfSaved(userId, matchId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const savedMatchController = new SavedMatchController();
