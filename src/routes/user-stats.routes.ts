import { Router } from 'express';
import { userStatsController } from '../controllers/user-stats.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @swagger
 * /stats:
 *   get:
 *     tags:
 *       - User Stats
 *     summary: Get user statistics for profile page
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPredictions:
 *                   type: integer
 *                   example: 45
 *                 correctPredictions:
 *                   type: integer
 *                   example: 32
 *                 wrongPredictions:
 *                   type: integer
 *                   example: 13
 *                 accuracyRate:
 *                   type: number
 *                   format: float
 *                   example: 71.11
 *                 currentStreak:
 *                   type: integer
 *                   example: 5
 *                 longestStreak:
 *                   type: integer
 *                   example: 12
 *                 totalMatchesWatched:
 *                   type: integer
 *                   example: 78
 *                 savedMatchesCount:
 *                   type: integer
 *                   example: 8
 *       401:
 *         description: Unauthorized
 */
router.get('/', userStatsController.getUserStats);

export default router;
