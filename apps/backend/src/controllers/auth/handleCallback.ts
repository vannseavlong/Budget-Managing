import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
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
      userInfo.email
    );

    // Generate JWT token for our application
    const jwtSecret =
      process.env.JWT_SECRET ||
      'development-secret-key-change-in-production-supersecurekey123456789';
    console.log('JWT Secret:', jwtSecret ? 'SET' : 'MISSING');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const payload = {
      email: userInfo.email,
      name: userInfo.name,
      spreadsheetId,
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

    // Store user session info (in production, use Redis or secure storage)
    const userSession = {
      email: userInfo.email,
      name: userInfo.name,
      spreadsheetId,
      googleCredentials: credentials,
      createdAt: new Date().toISOString(),
    };

    logger.info(`User authenticated and database created: ${userInfo.email}`);

    res.status(200).json({
      success: true,
      message: 'Authentication successful and database created',
      user: {
        email: userInfo.email,
        name: userInfo.name,
        spreadsheetId,
      },
      token: jwtToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }

    logger.error('Error handling auth callback:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}
