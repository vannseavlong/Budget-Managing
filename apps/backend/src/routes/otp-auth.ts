/**
 * OTP Authentication Routes
 * Routes for Telegram-based OTP authentication using Google Sheets
 */

import { Router, type Router as ExpressRouter } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  register,
  login,
  verifyOTP,
  linkTelegram,
  getStatus,
  completeGoogleSetup,
} from '../controllers/otp-auth';

const router: ExpressRouter = Router();

/**
 * @route   POST /api/v1/otp-auth/register
 * @desc    Register new user with email/password
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/v1/otp-auth/login
 * @desc    Login with email/password and receive OTP via Telegram
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/v1/otp-auth/verify-otp
 * @desc    Verify OTP code sent via Telegram
 * @access  Public
 */
router.post('/verify-otp', verifyOTP);

/**
 * @route   POST /api/v1/otp-auth/link-telegram
 * @desc    Link Telegram account to existing user
 * @access  Protected
 */
router.post('/link-telegram', authenticateToken, linkTelegram);

/**
 * @route   GET /api/v1/otp-auth/status
 * @desc    Check OTP authentication status
 * @access  Protected
 */
router.get('/status', authenticateToken, getStatus);

/**
 * @route   POST /api/v1/otp-auth/complete-google-setup
 * @desc    Complete Google OAuth setup and create user spreadsheet
 * @access  Public
 */
router.post('/complete-google-setup', completeGoogleSetup);

export default router;
