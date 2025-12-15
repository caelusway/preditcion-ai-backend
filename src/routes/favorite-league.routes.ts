import { Router } from 'express';
import { favoriteLeagueController } from '../controllers/favorite-league.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /me/favorite-leagues:
 *   get:
 *     tags:
 *       - Favorite Leagues
 *     summary: Get user's favorite leagues
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite leagues
 *       401:
 *         description: Unauthorized
 */
router.get('/', requireAuth, favoriteLeagueController.getFavoriteLeagues);

/**
 * @swagger
 * /me/favorite-leagues:
 *   post:
 *     tags:
 *       - Favorite Leagues
 *     summary: Add a league to favorites
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leagueId
 *               - leagueName
 *               - country
 *             properties:
 *               leagueId:
 *                 type: integer
 *                 description: API-Football league ID
 *               leagueName:
 *                 type: string
 *               country:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: League added to favorites
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: League already in favorites
 */
router.post('/', requireAuth, favoriteLeagueController.addFavoriteLeague);

/**
 * @swagger
 * /me/favorite-leagues/{leagueId}:
 *   delete:
 *     tags:
 *       - Favorite Leagues
 *     summary: Remove a league from favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema:
 *           type: integer
 *         description: API-Football league ID
 *     responses:
 *       200:
 *         description: League removed from favorites
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: League not in favorites
 */
router.delete('/:leagueId', requireAuth, favoriteLeagueController.removeFavoriteLeague);

export default router;
