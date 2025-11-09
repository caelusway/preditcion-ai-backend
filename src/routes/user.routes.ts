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
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
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

export default router;
