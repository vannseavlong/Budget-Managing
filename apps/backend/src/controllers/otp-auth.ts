/**
 * OTP Authentication Controllers
 * Handles email/password + Telegram OTP authentication using Google Sheets
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { GoogleSheetsOTPAdapter } from '../services/google-sheets-otp-adapter';
import { findUserSpreadsheetByEmail } from '../services/googleSheets/database';
import { getAuthenticatedClient } from '../services/googleSheets/client';
import { logger } from '../utils/logger';

// Initialize Google Sheets adapter
let otpAdapter: GoogleSheetsOTPAdapter | null = null;

/**
 * Initialize OTP adapter with Google Sheets auth
 */
export const initializeOTPAdapter = async (auth: any, spreadsheetId: string) => {
  try {
    otpAdapter = new GoogleSheetsOTPAdapter(auth, spreadsheetId);
    await otpAdapter.initializeSheets(spreadsheetId);
    logger.info('✅ OTP adapter initialized with Google Sheets');
    return otpAdapter;
  } catch (error) {
    logger.error('Failed to initialize OTP adapter:', error);
    throw error;
  }
};

/**
 * Get OTP adapter instance
 */
export const getOTPAdapter = (): GoogleSheetsOTPAdapter | null => {
  return otpAdapter;
};

/**
 * Generate OTP code (6 digits)
 */
const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP code with HMAC
 */
const hashOTP = (otp: string): string => {
  const hmacSecret = process.env.HMAC_SECRET || 'default-hmac-secret';
  return crypto.createHmac('sha256', hmacSecret).update(otp).digest('hex');
};

/**
 * Verify OTP code against hash
 */
const verifyOTPHash = (otp: string, hash: string): boolean => {
  const computedHash = hashOTP(otp);
  return computedHash === hash;
};

/**
 * Send OTP via Telegram
 */
const sendOTPViaTelegram = async (telegramChatId: string, otp: string, context: string): Promise<boolean> => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      logger.error('TELEGRAM_BOT_TOKEN not configured');
      return false;
    }

    const message = `🔐 Your OTP code for ${context}:\n\n*${otp}*\n\nThis code expires in 5 minutes.`;
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json() as { ok?: boolean };
    return data.ok === true;
  } catch (error) {
    logger.error('Failed to send OTP via Telegram:', error);
    return false;
  }
};

/**
 * Temporary in-memory storage for pending user registrations
 * In production, this should be moved to a proper database or Redis
 */
const pendingUsers = new Map<string, {
  email: string;
  username: string;
  password_hash: string;
  created_at: string;
}>();

/**
 * Get pending user data (for OAuth callback integration)
 */
export const getPendingUser = (email: string) => {
  return pendingUsers.get(email);
};

/**
 * Remove pending user (for OAuth callback integration)
 */
export const removePendingUser = (email: string) => {
  pendingUsers.delete(email);
};

/**
 * @route   POST /api/v1/otp-auth/register
 * @desc    Register new user with email/password (Step 1: Register without Google Sheets)
 * @access  Public
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check if user already registered in pending storage
    if (pendingUsers.has(email)) {
      return res.status(409).json({
        success: false,
        message: 'User with this email is already registered. Please complete your setup by linking Telegram and Google account.',
        requiresCompletion: true,
      });
    }

    // Check if user already exists in Google Sheets (if they already completed OAuth)
    const spreadsheetId = await findUserSpreadsheetByEmail(email);
    if (spreadsheetId) {
      try {
        const auth = getAuthenticatedClient();
        const adapter = new GoogleSheetsOTPAdapter(auth, spreadsheetId);
        await adapter.initializeSheets(spreadsheetId);
        const existingUser = await adapter.findUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'User with this email already exists',
          });
        }
      } catch (error) {
        logger.warn(`Could not check existing user in spreadsheet: ${error}`);
      }
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Store user in pending storage temporarily
    pendingUsers.set(email, {
      email,
      username: username || email.split('@')[0],
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    });

    logger.info(`User registered (pending setup): ${email}`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Next steps: 1) Link your Telegram account for OTP, 2) Verify your Google account to create your budget spreadsheet.',
      data: {
        email,
        username: username || email.split('@')[0],
        nextSteps: {
          telegram: 'Link Telegram account for OTP authentication',
          google: 'Verify Google account to create your budget spreadsheet',
        },
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
    });
  }
};

/**
 * @route   POST /api/v1/otp-auth/login
 * @desc    Login with email/password and send OTP via Telegram
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check if user is in pending storage (hasn't completed Google OAuth yet)
    const pendingUser = pendingUsers.get(email);
    if (pendingUser) {
      // Verify password for pending user
      const isPasswordValid = await bcrypt.compare(password, pendingUser.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Please complete your account setup by verifying your Google account to create your budget spreadsheet',
        requiresOAuth: true,
        setupIncomplete: true,
      });
    }

    // Check if user has completed OAuth and has a spreadsheet
    const spreadsheetId = await findUserSpreadsheetByEmail(email);
    if (!spreadsheetId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Create per-request adapter using server OAuth client
    const auth = getAuthenticatedClient();
    const adapter = new GoogleSheetsOTPAdapter(auth, spreadsheetId);
    await adapter.initializeSheets(spreadsheetId);

    // Find user
    const user = await adapter.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user has Telegram linked
    const telegramCred = await adapter.findTelegramCredentialByUserId(user.id);
    if (!telegramCred || !telegramCred.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please link and verify your Telegram account first',
        requiresTelegramLink: true,
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP request
    await adapter.createOTPRequest({
      user_id: user.id,
      otp_hash: otpHash,
      expires_at: expiresAt.toISOString(),
      used: false,
      context: 'login',
    });

    // Send OTP via Telegram
    const otpSent = await sendOTPViaTelegram(telegramCred.telegram_chat_id, otp, 'login');

    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP via Telegram',
      });
    }

    // Generate session token for OTP verification (include spreadsheetId)
    const sessionToken = jwt.sign(
      { userId: user.id, spreadsheetId, purpose: 'otp-verification' },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '10m' } as jwt.SignOptions
    );

    logger.info(`OTP sent to user: ${email}`);

    return res.json({
      success: true,
      message: 'OTP sent to your Telegram. Please verify to complete login.',
      data: {
        sessionToken,
        expiresIn: 300, // 5 minutes in seconds
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
};

/**
 * @route   POST /api/v1/otp-auth/verify-otp
 * @desc    Verify OTP code and complete login
 * @access  Public
 */
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { sessionToken, otpCode } = req.body;

    // Validate input
    if (!sessionToken || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Session token and OTP code are required',
      });
    }

    // Verify session token
    let decoded: any;
    try {
      decoded = jwt.verify(sessionToken, process.env.JWT_SECRET || 'default-secret');
      if (decoded.purpose !== 'otp-verification') {
        throw new Error('Invalid token purpose');
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token',
      });
    }

    const userId = decoded.userId;
    const spreadsheetId = decoded.spreadsheetId;

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session token: missing spreadsheet ID',
      });
    }

    // Create per-request adapter
    const auth = getAuthenticatedClient();
    const adapter = new GoogleSheetsOTPAdapter(auth, spreadsheetId);
    await adapter.initializeSheets(spreadsheetId);

    // Find valid OTP request
    const otpRequest = await adapter.findValidOTPRequest(userId, 'login');
    if (!otpRequest) {
      return res.status(401).json({
        success: false,
        message: 'No valid OTP found. Please request a new one.',
      });
    }

    // Verify OTP code
    const isOTPValid = verifyOTPHash(otpCode, otpRequest.otp_hash);
    if (!isOTPValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP code',
      });
    }

    // Mark OTP as used
    await adapter.markOTPRequestAsUsed(otpRequest.id);

    // Get user details
    const user = await adapter.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate JWT access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as jwt.SignOptions
    );

    logger.info(`User logged in successfully: ${user.email}`);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during OTP verification',
    });
  }
};

/**
 * @route   POST /api/v1/otp-auth/link-telegram
 * @desc    Link Telegram account (requires user to initiate from Telegram bot)
 * @access  Protected
 */
export const linkTelegram = async (req: Request, res: Response) => {
  try {
    const { telegramChatId, telegramUsername, email } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId && !email) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized or email required',
      });
    }

    if (!telegramChatId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram chat ID is required',
      });
    }

    // Find user spreadsheet (fallback to email if userId not in token)
    let spreadsheetId: string | null = null;
    if (email) {
      spreadsheetId = await findUserSpreadsheetByEmail(email);
    }

    if (!spreadsheetId) {
      return res.status(404).json({
        success: false,
        message: 'User spreadsheet not found',
      });
    }

    // Create per-request adapter
    const auth = getAuthenticatedClient();
    const adapter = new GoogleSheetsOTPAdapter(auth, spreadsheetId);
    await adapter.initializeSheets(spreadsheetId);

    // Check if already linked
    const existingCred = await adapter.findTelegramCredentialByUserId(userId);
    if (existingCred) {
      return res.status(409).json({
        success: false,
        message: 'Telegram account already linked',
      });
    }

    // Create Telegram credential
    await adapter.createTelegramCredential({
      user_id: userId,
      telegram_chat_id: telegramChatId,
      telegram_username: telegramUsername || '',
      is_verified: true, // Auto-verify for simplicity
    });

    logger.info(`Telegram linked for user ID: ${userId}`);

    return res.json({
      success: true,
      message: 'Telegram account linked successfully',
    });
  } catch (error) {
    logger.error('Telegram linking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during Telegram linking',
    });
  }
};

/**
 * @route   GET /api/v1/otp-auth/status
 * @desc    Check OTP authentication status
 * @access  Protected
 */
export const getStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const email = (req as any).user?.email;

    if (!userId && !email) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Find user spreadsheet
    let spreadsheetId: string | null = null;
    if (email) {
      spreadsheetId = await findUserSpreadsheetByEmail(email);
    }

    if (!spreadsheetId) {
      return res.json({
        success: true,
        data: {
          hasTelegramLinked: false,
          isTelegramVerified: false,
          telegramUsername: null,
        },
      });
    }

    // Create per-request adapter
    const auth = getAuthenticatedClient();
    const adapter = new GoogleSheetsOTPAdapter(auth, spreadsheetId);
    await adapter.initializeSheets(spreadsheetId);

    const telegramCred = await adapter.findTelegramCredentialByUserId(userId);

    return res.json({
      success: true,
      data: {
        hasTelegramLinked: !!telegramCred,
        isTelegramVerified: telegramCred?.is_verified || false,
        telegramUsername: telegramCred?.telegram_username || null,
      },
    });
  } catch (error) {
    logger.error('Status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during status check',
    });
  }
};

/**
 * @route   POST /api/v1/otp-auth/complete-google-setup
 * @desc    Complete Google OAuth setup and create user's spreadsheet (Step 3: Final setup)
 * @access  Public
 */
export const completeGoogleSetup = async (req: Request, res: Response) => {
  try {
    const { email, googleAccessToken } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if user is in pending storage
    const pendingUser = pendingUsers.get(email);
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: 'User registration not found. Please register first.',
      });
    }

    // Check if spreadsheet already exists
    let spreadsheetId = await findUserSpreadsheetByEmail(email);
    
    // Create spreadsheet if it doesn't exist
    if (!spreadsheetId) {
      const auth = getAuthenticatedClient();
      const { getOrCreateUserDatabase } = await import('../services/googleSheets/database.js');
      spreadsheetId = await getOrCreateUserDatabase(email, pendingUser.username);
      
      if (!spreadsheetId) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create user spreadsheet',
        });
      }
    }

    // Now create the user in the Google Sheets database
    const auth = getAuthenticatedClient();
    const adapter = new GoogleSheetsOTPAdapter(auth, spreadsheetId);
    await adapter.initializeSheets(spreadsheetId);

    // Check if user already exists in spreadsheet
    const existingUser = await adapter.findUserByEmail(email);
    if (existingUser) {
      // User already completed setup, remove from pending
      pendingUsers.delete(email);
      
      return res.json({
        success: true,
        message: 'Google account already verified',
        data: {
          spreadsheetId,
          setupComplete: true,
        },
      });
    }

    // Create user in Google Sheets
    const user = await adapter.createUser({
      email: pendingUser.email,
      username: pendingUser.username,
      password_hash: pendingUser.password_hash,
      is_active: true,
    });

    // Remove from pending storage
    pendingUsers.delete(email);

    logger.info(`User completed Google setup: ${email}`);

    return res.json({
      success: true,
      message: 'Google account verified successfully! Your budget spreadsheet has been created. You can now log in.',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        spreadsheetId,
        setupComplete: true,
      },
    });
  } catch (error) {
    logger.error('Complete Google setup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during Google setup completion',
    });
  }
};

export default {
  initializeOTPAdapter,
  getOTPAdapter,
  register,
  login,
  verifyOTP,
  linkTelegram,
  getStatus,
  completeGoogleSetup,
  getPendingUser,
  removePendingUser,
};
