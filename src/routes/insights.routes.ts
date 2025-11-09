import { Router } from 'express';
import { insightsController } from '../controllers/insights.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /insights/accuracy:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get prediction accuracy trends
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month]
 *           default: week
 *         description: Time period for accuracy data
 *     responses:
 *       200:
 *         description: Accuracy trend data
 *       401:
 *         description: Unauthorized
 */
router.get('/accuracy', requireAuth, insightsController.getAccuracy);

/**
 * @swagger
 * /insights/top-teams:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get top performing teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of teams to return
 *     responses:
 *       200:
 *         description: List of top teams
 *       401:
 *         description: Unauthorized
 */
router.get('/top-teams', requireAuth, insightsController.getTopTeams);

/**
 * @swagger
 * /insights/confidence-distribution:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get confidence level distribution
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Confidence distribution data
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/confidence-distribution',
  requireAuth,
  insightsController.getConfidenceDistribution
);

export default router;
