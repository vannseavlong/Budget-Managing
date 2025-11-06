import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import jwt from 'jsonwebtoken';
import { authCallbackSchema } from './types';

/**
 * Handle OAuth callback and create user database
 */
export async function handleCallback(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validate request query parameters (Google sends code via GET query params)
    const validatedData = authCallbackSchema.parse(req.query);
    const { code } = validatedData;

    const googleSheetsService = new GoogleSheetsService();

    // Exchange code for tokens
    const credentials = await googleSheetsService.getTokens(code);
    googleSheetsService.setCredentials(credentials);

    // Get user info
    const userInfo = await googleSheetsService.getUserInfo();

    // Get or create user's Google Sheets database (persistent across logins)
    const spreadsheetId = await googleSheetsService.getOrCreateUserDatabase(
      userInfo.email,
      userInfo.name
    );

    // Get user data from database to include telegram fields
    const userData = await googleSheetsService.find(spreadsheetId, 'users', {
      email: userInfo.email,
    });

    // Get the first (and should be only) user record
    const userRecord = userData[0];

    // Generate JWT token for our application
    const jwtSecret =
      process.env.JWT_SECRET ||
      'development-secret-key-change-in-production-supersecurekey123456789';

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const payload = {
      email: userInfo.email,
      name: userInfo.name,
      spreadsheetId,
      telegram_username: userRecord?.telegram_username || '',
      chatId: userRecord?.chatId || '',
      googleCredentials: credentials,
    };

    // Convert expires string to seconds for JWT
    const expiresInStr = process.env.JWT_EXPIRES_IN || '7d';
    let expiresInSeconds: number;

    if (expiresInStr.endsWith('d')) {
      expiresInSeconds = parseInt(expiresInStr) * 24 * 60 * 60; // days to seconds
    } else if (expiresInStr.endsWith('h')) {
      expiresInSeconds = parseInt(expiresInStr) * 60 * 60; // hours to seconds
    } else {
      expiresInSeconds = 7 * 24 * 60 * 60; // default 7 days
    }

    const jwtToken = jwt.sign(payload, jwtSecret, {
      expiresIn: expiresInSeconds,
    });

    logger.info(`User authenticated and database created: ${userInfo.email}`);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const callbackUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(jwtToken)}`;

    res.redirect(callbackUrl);
  } catch (error) {
    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorMessage =
      error instanceof Error ? error.message : 'Authentication failed';

    logger.error('Error handling auth callback:', error);

    const errorUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`;
    res.redirect(errorUrl);
  }
}
