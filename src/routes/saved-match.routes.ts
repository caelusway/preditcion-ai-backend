import { Router } from 'express';
import { savedMatchController } from '../controllers/saved-match.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @swagger
 * /saved-matches:
 *   get:
 *     tags:
 *       - Saved Matches
 *     summary: Get all saved matches for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, live, finished]
 *         description: Filter by match status
 *     responses:
 *       200:
 *         description: List of saved matches
 *       401:
 *         description: Unauthorized
 */
router.get('/', savedMatchController.getSavedMatches);

/**
 * @swagger
 * /saved-matches:
 *   post:
 *     tags:
 *       - Saved Matches
 *     summary: Save a match
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchId
 *             properties:
 *               matchId:
 *                 type: string
 *                 format: uuid
 *               teamId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional - which team you're supporting
 *               notes:
 *                 type: string
 *                 description: Optional personal notes
 *     responses:
 *       201:
 *         description: Match saved successfully
 *       404:
 *         description: Match not found
 *       409:
 *         description: Match already saved
 */
router.post('/', savedMatchController.saveMatch);

/**
 * @swagger
 * /saved-matches/{matchId}:
 *   delete:
 *     tags:
 *       - Saved Matches
 *     summary: Remove a match from saved matches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Match removed from saved matches
 *       404:
 *         description: Saved match not found
 */
router.delete('/:matchId', savedMatchController.unsaveMatch);

/**
 * @swagger
 * /saved-matches/{matchId}/check:
 *   get:
 *     tags:
 *       - Saved Matches
 *     summary: Check if a match is saved
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Check result
 */
router.get('/:matchId/check', savedMatchController.checkIfSaved);

export default router;
