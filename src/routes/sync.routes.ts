import { Router } from 'express';
import { syncController } from '../controllers/sync.controller';

const router = Router();

/**
 * @swagger
 * /sync/status:
 *   get:
 *     tags:
 *       - Sync
 *     summary: Get sync status
 *     description: Returns the current sync scheduler status and last sync info
 *     responses:
 *       200:
 *         description: Sync status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSchedulerRunning:
 *                   type: boolean
 *                 isSyncRunning:
 *                   type: boolean
 *                 lastSync:
 *                   type: object
 *                 nextSyncIn:
 *                   type: string
 */
router.get('/status', syncController.getStatus);

/**
 * @swagger
 * /sync/trigger:
 *   post:
 *     tags:
 *       - Sync
 *     summary: Manually trigger a full sync
 *     description: Syncs teams, fixtures, finished matches, and odds from API-Football
 *     responses:
 *       200:
 *         description: Sync completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     fixtures:
 *                       type: object
 *                     finished:
 *                       type: object
 *                     odds:
 *                       type: object
 *       409:
 *         description: Sync already in progress
 */
router.post('/trigger', syncController.triggerSync);

/**
 * @swagger
 * /sync/fixtures:
 *   post:
 *     tags:
 *       - Sync
 *     summary: Sync upcoming fixtures
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to sync
 *     responses:
 *       200:
 *         description: Fixtures sync completed
 */
router.post('/fixtures', syncController.syncFixtures);

/**
 * @swagger
 * /sync/odds:
 *   post:
 *     tags:
 *       - Sync
 *     summary: Sync odds for upcoming matches
 *     responses:
 *       200:
 *         description: Odds sync completed
 */
router.post('/odds', syncController.syncOdds);

/**
 * @swagger
 * /sync/finished:
 *   post:
 *     tags:
 *       - Sync
 *     summary: Sync finished matches
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of past days to sync
 *     responses:
 *       200:
 *         description: Finished matches sync completed
 */
router.post('/finished', syncController.syncFinished);

/**
 * @swagger
 * /sync/teams:
 *   post:
 *     tags:
 *       - Sync
 *     summary: Sync teams for all Top 5 leagues
 *     responses:
 *       200:
 *         description: Teams sync completed
 */
router.post('/teams', syncController.syncTeams);

export default router;
