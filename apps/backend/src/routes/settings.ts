import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getSettings,
  updateSettings,
  resetSettings,
} from '../controllers/settings';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', getSettings);

/**
 * @swagger
 * /api/v1/settings:
 *   put:
 *     summary: Update user settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *                 example: "USD"
 *                 minLength: 3
 *                 maxLength: 3
 *               language:
 *                 type: string
 *                 example: "en"
 *                 minLength: 2
 *               dark_mode:
 *                 type: boolean
 *                 example: false
 *               telegram_notifications:
 *                 type: boolean
 *                 example: true
 *               telegram_chat_id:
 *                 type: string
 *                 example: "123456789"
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put('/', updateSettings);

/**
 * @swagger
 * /api/v1/settings/reset:
 *   post:
 *     summary: Reset settings to default
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/reset', resetSettings);

export default router;
