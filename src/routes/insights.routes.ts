import { Router } from 'express';
import { insightsController } from '../controllers/insights.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /insights:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get all insights data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete insights data
 *       401:
 *         description: Unauthorized
 */
router.get('/', requireAuth, insightsController.getAllInsights);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                   example: week
 *                 accuracy:
 *                   type: number
 *                   example: 68.5
 *                 totalPredictions:
 *                   type: integer
 *                   example: 127
 *                 correctPredictions:
 *                   type: integer
 *                   example: 87
 *                 accuracyByDay:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day:
 *                         type: string
 *                       accuracy:
 *                         type: number
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
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [default, legacy]
 *         description: Response format (legacy for old format)
 *     responses:
 *       200:
 *         description: List of top teams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                       teamName:
 *                         type: string
 *                       totalPredictions:
 *                         type: integer
 *                       accuracy:
 *                         type: number
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: string
 *                         enum: [High, Medium, Low]
 *                       percentage:
 *                         type: integer
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/confidence-distribution',
  requireAuth,
  insightsController.getConfidenceDistribution
);

/**
 * @swagger
 * /insights/surprises:
 *   get:
 *     tags:
 *       - Insights
 *     summary: Get surprise match results
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of surprises to return
 *     responses:
 *       200:
 *         description: List of surprise results
 *       401:
 *         description: Unauthorized
 */
router.get('/surprises', requireAuth, insightsController.getSurprises);

export default router;
