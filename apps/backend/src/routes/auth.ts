import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  initiateAuth,
  handleCallback,
  refreshToken,
  getProfile,
  validateDatabase,
  recreateDatabase,
  logout,
} from '../controllers/auth';

const router = Router();

// Public routes
router.get('/google', initiateAuth);
router.get('/google/callback', handleCallback);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.get('/validate-database', authenticateToken, validateDatabase);
router.post('/recreate-database', authenticateToken, recreateDatabase);
router.post('/logout', authenticateToken, logout);

export default router;
