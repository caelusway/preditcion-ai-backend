import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';
import { updateProfileSchema } from '../schemas/auth.schemas';

const router = Router();

/**
 * @swagger
 * /me:
 *   get:
 *     tags:
 *       - User
 *     summary: Get current user profile
 *     description: Returns user profile including username and selected team
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 email:
 *                   type: string
 *                 username:
 *                   type: string
 *                   description: User's unique username for easy login
 *                 name:
 *                   type: string
 *                 surname:
 *                   type: string
 *                 emailVerified:
 *                   type: boolean
 *                 selectedTeam:
 *                   type: object
 *                   nullable: true
 *                   description: User's selected favorite team
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     logoUrl:
 *                       type: string
 *                     league:
 *                       type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags:
 *       - User
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               surname:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email already exists
 */
router.get('/', requireAuth, authController.getProfile);
router.put(
  '/',
  requireAuth,
  validate(updateProfileSchema),
  authController.updateProfile
);

/**
 * @swagger
 * /me:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete user account
 *     description: Permanently delete the user account and all associated data. Requires password confirmation.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Current password for confirmation
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account deleted successfully
 *       401:
 *         description: Unauthorized or invalid password
 */
router.delete('/', requireAuth, authController.deleteAccount);

/**
 * @swagger
 * /me/team:
 *   post:
 *     tags:
 *       - User
 *     summary: Select favorite team
 *     description: Set the user's favorite team
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamId
 *             properties:
 *               teamId:
 *                 type: string
 *                 description: Team UUID
 *     responses:
 *       200:
 *         description: Team selected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Team not found
 */
router.post('/team', requireAuth, authController.selectTeam);

export default router;
