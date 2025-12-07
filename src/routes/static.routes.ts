import { Router } from 'express';
import { staticController } from '../controllers/static.controller';

const router = Router();

/**
 * @swagger
 * /static:
 *   get:
 *     tags:
 *       - Static Data
 *     summary: Get all static configuration data
 *     responses:
 *       200:
 *         description: All static data
 */
router.get('/', staticController.getAllStaticData);

/**
 * @swagger
 * /static/betting-tips:
 *   get:
 *     tags:
 *       - Static Data
 *     summary: Get betting tips codes and descriptions
 *     responses:
 *       200:
 *         description: List of betting tips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bettingTips:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                         example: "1"
 *                       description:
 *                         type: string
 *                         example: "Home Team Wins"
 */
router.get('/betting-tips', staticController.getBettingTips);

/**
 * @swagger
 * /static/navigation:
 *   get:
 *     tags:
 *       - Static Data
 *     summary: Get navigation menu items
 *     responses:
 *       200:
 *         description: Navigation menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 menuItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       label:
 *                         type: string
 *                       route:
 *                         type: string
 *                       icon:
 *                         type: string
 */
router.get('/navigation', staticController.getNavigation);

/**
 * @swagger
 * /static/faq:
 *   get:
 *     tags:
 *       - Static Data
 *     summary: Get FAQ data
 *     responses:
 *       200:
 *         description: FAQ categories and items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             question:
 *                               type: string
 *                             answer:
 *                               type: string
 *                 supportEmail:
 *                   type: string
 */
router.get('/faq', staticController.getFaq);

/**
 * @swagger
 * /static/settings:
 *   get:
 *     tags:
 *       - Static Data
 *     summary: Get settings options (languages, odds formats, timezones)
 *     responses:
 *       200:
 *         description: Settings options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 languages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       flag:
 *                         type: string
 *                 oddsFormats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                 timezones:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 */
router.get('/settings', staticController.getSettings);

/**
 * @swagger
 * /static/onboarding:
 *   get:
 *     tags:
 *       - Static Data
 *     summary: Get onboarding screens data
 *     responses:
 *       200:
 *         description: Onboarding screens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 screens:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image:
 *                         type: string
 */
router.get('/onboarding', staticController.getOnboarding);

/**
 * @swagger
 * /static/home-stats:
 *   get:
 *     tags:
 *       - Static Data
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
router.get('/home-stats', staticController.getHomeStats);

/**
 * @swagger
 * /static/filters:
 *   get:
 *     tags:
 *       - Static Data
 *     summary: Get filter options for UI
 *     responses:
 *       200:
 *         description: Filter options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dateFilters:
 *                   type: array
 *                   items:
 *                     type: string
 *                 matchTypeFilters:
 *                   type: array
 *                   items:
 *                     type: string
 *                 timeFilters:
 *                   type: array
 *                   items:
 *                     type: string
 *                 confidenceLevels:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/filters', staticController.getFilters);

export default router;

