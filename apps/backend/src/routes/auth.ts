import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  googleAuth,
  googleCallback,
  register,
  login,
  refresh,
  getProfile,
  logout,
} from '../controllers/auth';

const router: Router = Router();

// Public routes
router.get('/google', googleAuth);
router.get('/callback', googleCallback);
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);

export default router;
