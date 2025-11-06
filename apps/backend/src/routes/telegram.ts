import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getMessages,
  sendMessage,
  configureWebhook,
  handleWebhook,
  testConnection,
  debugEnv,
  setupNotifications,
} from '../controllers/telegram';

const router = express.Router();

// Apply authentication middleware to all routes except webhook
router.use(authenticateToken);
router.use('/messages', authenticateToken);
router.use('/send', authenticateToken);
router.use('/configure', authenticateToken);
router.use('/test', authenticateToken);

/**
 * @swagger
 * /api/v1/telegram/messages:
 *   get:
 *     summary: Get Telegram message history
 *     tags: [Telegram]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed]
 *     responses:
 *       200:
 *         description: Telegram messages retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/messages', getMessages);

/**
 * @swagger
 * /api/v1/telegram/send:
 *   post:
 *     summary: Send a Telegram message
 *     tags: [Telegram]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chat_id
 *               - payload
 *             properties:
 *               chat_id:
 *                 type: string
 *                 example: "123456789"
 *               payload:
 *                 type: object
 *                 required:
 *                   - type
 *                   - message
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [budget_alert, goal_alert, transaction_reminder, custom]
 *                   message:
 *                     type: string
 *                     example: "Budget limit exceeded for Groceries"
 *                   data:
 *                     type: object
 *     responses:
 *       201:
 *         description: Telegram message queued successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/send', sendMessage);

/**
 * @swagger
 * /api/v1/telegram/notifications/setup:
 *   post:
 *     summary: Setup Telegram notifications for user
 *     tags: [Telegram]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chat_id
 *             properties:
 *               chat_id:
 *                 type: string
 *                 example: "123456789"
 *               notification_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [budget_alert, goal_alert, transaction_reminder, custom]
 *               enable_all:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Notifications setup completed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/notifications/setup', setupNotifications);

/**
 * @swagger
 * /api/v1/telegram/configure:
 *   post:
 *     summary: Configure Telegram webhook
 *     tags: [Telegram]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - webhook_url
 *               - bot_token
 *             properties:
 *               webhook_url:
 *                 type: string
 *                 format: uri
 *               bot_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Telegram webhook configured successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/configure', configureWebhook);

/**
 * @swagger
 * /api/v1/telegram/webhook:
 *   post:
 *     summary: Handle Telegram webhook updates
 *     tags: [Telegram]
 *     description: This endpoint receives updates from Telegram Bot API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       500:
 *         description: Internal server error
 */
router.post('/webhook', handleWebhook);

/**
 * @swagger
 * /api/v1/telegram/test:
 *   get:
 *     summary: Test Telegram bot connection
 *     tags: [Telegram]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Telegram connection tested successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/test', testConnection);

/**
 * @swagger
 * /api/v1/telegram/connect-success:
 *   get:
 *     summary: Handle successful Telegram connection and redirect to app
 *     tags: [Telegram]
 *     parameters:
 *       - in: query
 *         name: user_email
 *         schema:
 *           type: string
 *         description: User email for identification
 *       - in: query
 *         name: telegram_username
 *         schema:
 *           type: string
 *         description: Telegram username
 *       - in: query
 *         name: chat_id
 *         schema:
 *           type: string
 *         description: Telegram chat ID
 *     responses:
 *       302:
 *         description: Redirect to app with success message
 *       400:
 *         description: Invalid parameters
 */
router.get('/connect-success', (req, res): void => {
  const { user_email, telegram_username, chat_id } = req.query;

  if (!user_email || !telegram_username || !chat_id) {
    res.status(400).json({
      success: false,
      message: 'Missing required parameters',
    });
    return;
  }

  // Redirect to frontend settings page with success parameters
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectUrl = `${frontendUrl}/settings?telegram_connected=true&username=${encodeURIComponent(telegram_username as string)}`;

  res.redirect(redirectUrl);
});

router.get('/debug', debugEnv);

export default router;
