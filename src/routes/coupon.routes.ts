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
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [active, settled, cancelled]
 *                   totalOdds:
 *                     type: number
 *                     description: Combined odds of all selections
 *                     example: 5.67
 *                   selections:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         matchApiId:
 *                           type: string
 *                         homeTeamName:
 *                           type: string
 *                         awayTeamName:
 *                           type: string
 *                         kickoffTime:
 *                           type: string
 *                           format: date-time
 *                         league:
 *                           type: string
 *                         predictionType:
 *                           type: string
 *                           enum: [1x2, btts, over_under, double_chance]
 *                           example: btts
 *                         prediction:
 *                           type: string
 *                           example: "Yes"
 *                         odds:
 *                           type: number
 *                           example: 1.65
 *                         result:
 *                           type: string
 *                           enum: [pending, won, lost]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/', requireAuth, couponController.getCoupons);

/**
 * @swagger
 * /coupons/active:
 *   get:
 *     tags:
 *       - Coupons
 *     summary: Get active coupon
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active coupon or null
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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of past coupons
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
 *     responses:
 *       200:
 *         description: Coupon details with selections and odds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [active, settled, cancelled]
 *                 totalOdds:
 *                   type: number
 *                   example: 5.67
 *                 selections:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       homeTeamName:
 *                         type: string
 *                       awayTeamName:
 *                         type: string
 *                       predictionType:
 *                         type: string
 *                         example: "1x2"
 *                       prediction:
 *                         type: string
 *                         example: "1"
 *                       odds:
 *                         type: number
 *                         example: 1.85
 *                       result:
 *                         type: string
 *                         enum: [pending, won, lost]
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
 *     responses:
 *       201:
 *         description: Coupon created
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *               homeTeamName:
 *                 type: string
 *               awayTeamName:
 *                 type: string
 *               kickoffTime:
 *                 type: string
 *                 format: date-time
 *               league:
 *                 type: string
 *               predictionType:
 *                 type: string
 *                 enum: [1x2, btts, over_under, double_chance]
 *               prediction:
 *                 type: string
 *                 description: "1, X, 2, Yes, No, Over 2.5, etc."
 *               odds:
 *                 type: number
 *     responses:
 *       201:
 *         description: Selection added
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: selectionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Selection removed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Coupon or selection not found
 */
router.delete('/:id/selections/:selectionId', requireAuth, couponController.removeSelection);

export default router;
