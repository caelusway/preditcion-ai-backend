import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /coupons:
 *   get:
 *     tags:
 *       - Coupons
 *     summary: Get all user coupons
 *     description: Returns all coupons with selections and calculated odds
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coupons with odds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 *
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           example: "Weekend Coupon"
 *         status:
 *           type: string
 *           enum: [active, settled, cancelled]
 *           example: active
 *         totalOdds:
 *           type: number
 *           description: Combined odds of all selections
 *           example: 5.67
 *         selections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CouponSelection'
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CouponSelection:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         matchApiId:
 *           type: string
 *           example: "1234567"
 *         homeTeamName:
 *           type: string
 *           example: "Manchester United"
 *         awayTeamName:
 *           type: string
 *           example: "Liverpool"
 *         kickoffTime:
 *           type: string
 *           format: date-time
 *         league:
 *           type: string
 *           example: "Premier League"
 *         predictionType:
 *           type: string
 *           enum: [1x2, btts, over_under, double_chance]
 *           example: btts
 *         prediction:
 *           type: string
 *           description: "The prediction value (1, X, 2, Yes, No, Over 2.5, etc.)"
 *           example: "Yes"
 *         odds:
 *           type: number
 *           example: 1.65
 *         result:
 *           type: string
 *           enum: [pending, won, lost]
 *           nullable: true
 *           example: pending
 */
router.get('/', requireAuth, couponController.getCoupons);

/**
 * @swagger
 * /coupons/active:
 *   get:
 *     tags:
 *       - Coupons
 *     summary: Get active coupon
 *     description: Returns the user's currently active coupon or null if none exists
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active coupon or null
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupon:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/Coupon'
 *                     - type: 'null'
 *       401:
 *         description: Unauthorized
 */
router.get('/active', requireAuth, couponController.getActiveCoupon);

/**
 * @swagger
 * /coupons/past:
 *   get:
 *     tags:
 *       - Coupons
 *     summary: Get past coupons (settled or cancelled)
 *     description: Returns all coupons that are no longer active
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of past coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 */
router.get('/past', requireAuth, couponController.getPastCoupons);

/**
 * @swagger
 * /coupons/{id}:
 *   get:
 *     tags:
 *       - Coupons
 *     summary: Get coupon by ID with full details
 *     description: Returns coupon with all selections, odds, and results
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID (UUID)
 *     responses:
 *       200:
 *         description: Coupon details with selections and odds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon not found
 */
router.get('/:id', requireAuth, couponController.getCouponById);

/**
 * @swagger
 * /coupons:
 *   post:
 *     tags:
 *       - Coupons
 *     summary: Create a new coupon
 *     description: Creates a new empty coupon for the user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Optional coupon name
 *                 example: "Weekend Bets"
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, couponController.createCoupon);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     tags:
 *       - Coupons
 *     summary: Delete a coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon not found
 */
router.delete('/:id', requireAuth, couponController.deleteCoupon);

/**
 * @swagger
 * /coupons/{id}/selections:
 *   post:
 *     tags:
 *       - Coupons
 *     summary: Add a match selection to coupon
 *     description: Add a prediction for a match to an existing coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchApiId
 *               - homeTeamName
 *               - awayTeamName
 *               - kickoffTime
 *               - league
 *               - predictionType
 *               - prediction
 *               - odds
 *             properties:
 *               matchApiId:
 *                 type: string
 *                 description: API-Football fixture ID
 *                 example: "1234567"
 *               homeTeamName:
 *                 type: string
 *                 example: "Manchester United"
 *               awayTeamName:
 *                 type: string
 *                 example: "Liverpool"
 *               kickoffTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-20T15:00:00Z"
 *               league:
 *                 type: string
 *                 example: "Premier League"
 *               predictionType:
 *                 type: string
 *                 enum: [1x2, btts, over_under, double_chance]
 *                 example: "1x2"
 *               prediction:
 *                 type: string
 *                 description: "1 (home win), X (draw), 2 (away win), Yes/No (BTTS), Over 2.5/Under 2.5, etc."
 *                 example: "1"
 *               odds:
 *                 type: number
 *                 example: 1.85
 *     responses:
 *       201:
 *         description: Selection added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon not found
 *       409:
 *         description: Match already in coupon
 */
router.post('/:id/selections', requireAuth, couponController.addSelection);

/**
 * @swagger
 * /coupons/{id}/selections/{selectionId}:
 *   delete:
 *     tags:
 *       - Coupons
 *     summary: Remove a selection from coupon
 *     description: Remove a match prediction from an existing coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID (UUID)
 *       - in: path
 *         name: selectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Selection ID (UUID)
 *     responses:
 *       200:
 *         description: Selection removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon or selection not found
 */
router.delete('/:id/selections/:selectionId', requireAuth, couponController.removeSelection);

export default router;
