import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getMessages,
  sendMessage,
  configureWebhook,
  handleWebhook,
  testConnection,
  debugEnv,
  setupNotifications,
  connectTelegram,
  getConnectionStatus,
  debugConnections,
  disconnectTelegram,
  debugNoAuth,
  fixConnection,
  createTestConnection,
  connectSuccess,
} from '../controllers/telegram';

const router: Router = Router();

// Webhook route MUST be defined before authentication middleware —
// Telegram webhooks don't include authentication tokens.
router.post('/webhook', handleWebhook);

// Debug route without authentication.
router.get('/debug-no-auth', debugNoAuth);

// Manual fix route to update a connection with the correct email.
router.get('/fix-connection/:oldEmail/:newEmail', fixConnection);

// Test route to manually create a connection for testing.
router.get('/test-connection/:email/:username/:chatId', createTestConnection);

// Bot-driven redirect target — the browser lands here straight from a
// Telegram-initiated flow with no app JWT available, same reason webhook
// and the routes above are public. backend-v1 had this route positioned
// after its authenticateToken middleware, which meant it 401'd whenever
// actually hit as intended (no bearer token in that context) — a latent
// bug there, not an intentional auth requirement, so it's fixed here
// rather than ported.
router.get('/connect-success', connectSuccess);

// Apply authentication middleware to all other routes — matches
// backend-v1's exact ordering (authenticateToken is applied partway
// through the route file, not at the top).
router.use(authenticateToken);

router.get('/messages', getMessages);
router.post('/send', sendMessage);
router.post('/setup-notifications', setupNotifications);
router.post('/connect', connectTelegram);
router.get('/status', getConnectionStatus);
router.post('/disconnect', disconnectTelegram);
router.get('/debug-connections', debugConnections);
router.post('/configure', configureWebhook);

// Webhook route is defined at the top before authentication middleware.

router.get('/test', testConnection);
router.get('/debug', debugEnv);

export default router;
