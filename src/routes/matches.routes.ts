import { Router } from 'express';
import { matchesController } from '../controllers/matches.controller';

const router = Router();

/**
 * @swagger
 * /matches:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get matches grouped by league
 *     description: Returns matches grouped by league with optional date filtering
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
 *           example: "2025-12-15"
 *         description: Filter by specific date (YYYY-MM-DD format) or use yesterday/today/tomorrow
 *     responses:
 *       200:
 *         description: Matches grouped by league
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   example: "2025-12-15"
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       league:
 *                         type: string
 *                         example: "Premier League"
 *                       country:
 *                         type: string
 *                         example: "England"
 *                       leagueImg:
 *                         type: string
 *                         example: "https://media.api-sports.io/football/leagues/39.png"
 *                       leagueId:
 *                         type: integer
 *                         example: 39
 *                       matches:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             apiId:
 *                               type: string
 *                             homeTeam:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 logoUrl:
 *                                   type: string
 *                             awayTeam:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 logoUrl:
 *                                   type: string
 *                             kickoffTime:
 *                               type: string
 *                               format: date-time
 *                             status:
 *                               type: string
 *                               enum: [upcoming, live, finished]
 *                             homeScore:
 *                               type: integer
 *                             awayScore:
 *                               type: integer
 *                             venue:
 *                               type: string
 *                             referee:
 *                               type: string
 *                             round:
 *                               type: string
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
 * /matches/backtest:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Run backtest on historical matches (GET)
 *     description: Evaluate prediction accuracy against finished matches
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 200
 *         description: Number of matches to test
 *     responses:
 *       200:
 *         description: Backtest results with accuracy metrics
 */
router.get('/backtest', matchesController.runBacktest);

/**
 * @swagger
 * /matches/{id}:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get match details with statistics and predictions
 *     description: Returns comprehensive match data including statistics, form, recent matches, standings, and AI predictions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match details with all statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 match:
 *                   type: object
 *                   description: Basic match information
 *                 matchStatistics:
 *                   type: object
 *                   description: Average per match statistics
 *                   properties:
 *                     totalGoals:
 *                       type: object
 *                       properties:
 *                         home:
 *                           type: number
 *                         away:
 *                           type: number
 *                     goalsScored:
 *                       type: object
 *                     goalsAgainst:
 *                       type: object
 *                     possession:
 *                       type: object
 *                     totalShots:
 *                       type: object
 *                     shotsOnGoal:
 *                       type: object
 *                     corners:
 *                       type: object
 *                     yellowCards:
 *                       type: object
 *                 formStatistics:
 *                   type: object
 *                   description: Last 10 matches form statistics
 *                   properties:
 *                     wins:
 *                       type: object
 *                     over15Goals:
 *                       type: object
 *                     over25Goals:
 *                       type: object
 *                     over35Goals:
 *                       type: object
 *                     bothTeamsScored:
 *                       type: object
 *                 homeTeamRecentMatches:
 *                   type: array
 *                   description: Home team's last 10 matches
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       result:
 *                         type: string
 *                         enum: [W, D, L]
 *                       homeTeam:
 *                         type: object
 *                       awayTeam:
 *                         type: object
 *                       homeScore:
 *                         type: integer
 *                       awayScore:
 *                         type: integer
 *                 awayTeamRecentMatches:
 *                   type: array
 *                   description: Away team's last 10 matches
 *                 standings:
 *                   type: array
 *                   description: League standings
 *                   items:
 *                     type: object
 *                     properties:
 *                       position:
 *                         type: integer
 *                       team:
 *                         type: object
 *                       matches:
 *                         type: integer
 *                       goals:
 *                         type: string
 *                       points:
 *                         type: integer
 *                       isHighlighted:
 *                         type: boolean
 *                 aiPredictions:
 *                   type: array
 *                   description: AI prediction tips
 *                   items:
 *                     type: object
 *                     properties:
 *                       label:
 *                         type: string
 *                       prediction:
 *                         type: string
 *                       odds:
 *                         type: number
 *                       confidence:
 *                         type: integer
 *                       oddsDirection:
 *                         type: string
 *                 matchHeaderOdds:
 *                   type: object
 *                   properties:
 *                     homeWin:
 *                       type: object
 *                     draw:
 *                       type: object
 *                     awayWin:
 *                       type: object
 *                 statsPredictions:
 *                   type: object
 *                   description: Predicted match statistics
 *                   properties:
 *                     xG:
 *                       type: object
 *                     possession:
 *                       type: object
 *                     totalShots:
 *                       type: object
 *                     corners:
 *                       type: object
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

/**
 * @swagger
 * /matches/{id}/odds:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get betting odds for a match
 *     description: Returns real betting odds from bookmakers for various markets (1X2, Over/Under, BTTS, Double Chance)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Betting odds for the match
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matchId:
 *                   type: string
 *                 homeTeam:
 *                   type: string
 *                 awayTeam:
 *                   type: string
 *                 bookmaker:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 markets:
 *                   type: object
 *                   properties:
 *                     matchWinner:
 *                       type: object
 *                       description: "1X2 odds"
 *                     overUnder:
 *                       type: object
 *                       description: "Goals Over/Under odds"
 *                     btts:
 *                       type: object
 *                       description: "Both Teams to Score odds"
 *                     doubleChance:
 *                       type: object
 *                       description: "Double Chance odds"
 *       404:
 *         description: Match not found
 */
router.get('/:id/odds', matchesController.getMatchOdds);

/**
 * @swagger
 * /matches/backtest:
 *   post:
 *     tags:
 *       - Matches
 *     summary: Run backtest on historical matches
 *     description: Evaluate prediction accuracy against finished matches
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-14"
 *               limit:
 *                 type: integer
 *                 default: 50
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Backtest results with accuracy metrics
 */
router.post('/backtest', matchesController.runBacktest);

export default router;
