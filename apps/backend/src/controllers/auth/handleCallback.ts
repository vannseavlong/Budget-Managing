import { Request, Response } from 'express';
import { handleCallbackService } from '../../services/googleSheets/endpoints/auth/handleCallbackService';
import { logger } from '../../utils/logger';
import jwt from 'jsonwebtoken';
import { authCallbackSchema } from './types';
import { getPendingUser, removePendingUser } from '../otp-auth';
import { GoogleSheetsOTPAdapter } from '../../services/google-sheets-otp-adapter';
import { getAuthenticatedClient } from '../../services/googleSheets/client';
import { isAdminEmail } from '../../utils/adminRole';
import { storeAdminTokens } from '../../services/sheetDb/adapter';
import { recordLogin } from '../../services/sheetDb/adminStats';
import { ensureAdminSheetAccess } from '../../services/sheetDb/ensureAdminSheetAccess';

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

    const googleSheetsService = handleCallbackService;

    // Exchange code for tokens
    const credentials = await googleSheetsService.getTokens(code);
    googleSheetsService.setCredentials(credentials);

    // Get user info
    const userInfo = await googleSheetsService.getUserInfo();

    // Check if there's a pending user registration for this email
    const pendingUser = getPendingUser(userInfo.email);

    // Get or create user's Google Sheets database (persistent across logins)
    const spreadsheetId = await googleSheetsService.getOrCreateUserDatabase(
      userInfo.email,
      pendingUser?.username || userInfo.name
    );

    // If there's a pending user, complete their registration in the spreadsheet
    if (pendingUser) {
      try {
        const auth = getAuthenticatedClient();
        const adapter = new GoogleSheetsOTPAdapter(auth, spreadsheetId);
        await adapter.initializeSheets(spreadsheetId);

        // Check if user already exists
        const existingUser = await adapter.findUserByEmail(userInfo.email);
        
        if (!existingUser) {
          // Create user with the password they registered with
          await adapter.createUser({
            email: pendingUser.email,
            username: pendingUser.username,
            password_hash: pendingUser.password_hash,
            is_active: true,
          });
          
          logger.info(`Completed registration for pending user: ${userInfo.email}`);
        }

        // Remove from pending users
        removePendingUser(userInfo.email);
      } catch (error) {
        logger.error('Error completing pending user registration:', error);
        // Continue with normal OAuth flow even if this fails
      }
    }

    // Get user data from database to include telegram fields
    const userData = await googleSheetsService.find(spreadsheetId, 'users', {
      email: userInfo.email,
    });

    // Get the first (and should be only) user record
    const userRecord = userData[0];

    // Role is computed from an env allowlist, never persisted as a source
    // of truth (see utils/adminRole.ts).
    const role = isAdminEmail(userInfo.email) ? 'admin' : 'user';

    if (
      process.env.SUPER_ADMIN_EMAIL &&
      userInfo.email === process.env.SUPER_ADMIN_EMAIL
    ) {
      // The sheet-db adapter is backed by exactly one Google identity
      // (SUPER_ADMIN_EMAIL) — distinct from the broader ADMIN_EMAILS
      // allowlist used for app-level `role` (a multi-admin ADMIN_EMAILS
      // list would otherwise clobber this with whichever admin logged in
      // last). Bootstraps/refreshes that one identity's tokens.
      // Best-effort: a failure here must not block the admin's own login.
      storeAdminTokens(credentials).catch((error) => {
        logger.error('Failed to store admin sheet-db tokens:', error);
      });
    } else {
      // Legacy/existing user sheets were created before this app adopted
      // longcelot-sheet-db and were never shared with the admin account —
      // lsdb's adapter always reads/writes through the one admin identity
      // above, so grant it editor access here (idempotent) using this
      // user's own credentials. Best-effort: never blocks login.
      ensureAdminSheetAccess(credentials, spreadsheetId).catch((error) => {
        logger.error('Failed to ensure admin sheet-db access:', error);
      });
    }

    // Fire-and-forget: records the login in the admin-only user_stats
    // table (aggregate counts for the admin dashboard). Never touches the
    // user's own spreadsheet and never blocks login on failure.
    recordLogin(
      (userRecord?.id as string | undefined) || userInfo.email,
      userInfo.email,
      role
    );

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
      role,
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
