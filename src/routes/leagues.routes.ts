import { Router } from 'express';
import { leaguesController } from '../controllers/static.controller';

const router = Router();

/**
 * @swagger
 * /leagues/{id}/standings:
 *   get:
 *     tags:
 *       - Leagues
 *     summary: Get league standings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: League ID
 *     responses:
 *       200:
 *         description: League standings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leagueId:
 *                   type: string
 *                 standings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       position:
 *                         type: integer
 *                       team:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                       matches:
 *                         type: integer
 *                       goals:
 *                         type: string
 *                       points:
 *                         type: integer
 *                       isHighlighted:
 *                         type: boolean
 */
router.get('/:id/standings', leaguesController.getStandings);

export default router;

