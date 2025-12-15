import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';

export class TeamController {
  /**
   * GET /teams/selectable - Get all selectable teams grouped by league
   */
  async getSelectableTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await teamService.getSelectableTeams();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /teams/:id - Get a specific team by ID
   */
  async getTeamById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const team = await teamService.getTeamById(id);

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.status(200).json(team);
    } catch (error) {
      next(error);
    }
  }
}

export const teamController = new TeamController();
