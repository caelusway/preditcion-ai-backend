import { Router } from 'express';
import { teamController } from '../controllers/team.controller';

const router = Router();

/**
 * @swagger
 * /teams/selectable:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Get selectable teams for user selection
 *     description: Returns all teams from Top 5 European leagues grouped by league
 *     responses:
 *       200:
 *         description: Teams grouped by league
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leagues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       country:
 *                         type: string
 *                       logo:
 *                         type: string
 *                       teams:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             apiId:
 *                               type: string
 *                             name:
 *                               type: string
 *                             logoUrl:
 *                               type: string
 */
router.get('/selectable', teamController.getSelectableTeams);

/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Get team by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team details
 *       404:
 *         description: Team not found
 */
router.get('/:id', teamController.getTeamById);

export default router;
