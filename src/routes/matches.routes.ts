import { Router } from 'express';
import { matchesController } from '../controllers/matches.controller';

const router = Router();

/**
 * @swagger
 * /matches:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get list of matches (paginated)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (starts from 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of matches per page (max 100)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, live, finished]
 *         description: Filter by match status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           enum: [yesterday, today, tomorrow]
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: Paginated list of matches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Match'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 20
 *                     totalItems:
 *                       type: integer
 *                       example: 70
 *                     totalPages:
 *                       type: integer
 *                       example: 4
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized
 */
router.get('/', matchesController.getMatches);

/**
 * @swagger
 * /matches/upcoming:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get upcoming matches
 *     responses:
 *       200:
 *         description: List of upcoming matches
 */
router.get('/upcoming', matchesController.getUpcomingMatches);

/**
 * @swagger
 * /matches/home-stats:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get home stats (predicted, upcoming, won counts)
 *     responses:
 *       200:
 *         description: Home stats data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 predicted:
 *                   type: integer
 *                   example: 571
 *                 upcoming:
 *                   type: integer
 *                   example: 536
 *                 won:
 *                   type: integer
 *                   example: 23
 */
router.get('/home-stats', matchesController.getHomeStats);

/**
 * @swagger
 * /matches/{id}:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get match details with prediction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match details with prediction
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Match not found
 */
router.get('/:id', matchesController.getMatchById);

/**
 * @swagger
 * /matches/{id}/predictions:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get AI predictions for match
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: AI predictions for the match
 *       404:
 *         description: Match not found
 */
router.get('/:id/predictions', matchesController.getMatchPredictions);

/**
 * @swagger
 * /matches/{id}/statistics:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get match statistics
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match statistics
 *       404:
 *         description: Match not found
 */
router.get('/:id/statistics', matchesController.getMatchStatistics);

/**
 * @swagger
 * /matches/{id}/form:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get team form data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Team form statistics
 */
router.get('/:id/form', matchesController.getMatchForm);

/**
 * @swagger
 * /matches/{id}/recent:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get recent matches for teams
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Recent matches for both teams
 */
router.get('/:id/recent', matchesController.getRecentMatches);

export default router;
