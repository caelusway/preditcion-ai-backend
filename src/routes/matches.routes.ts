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

export default router;
