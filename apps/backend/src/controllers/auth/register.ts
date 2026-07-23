import { Request, Response } from 'express';
import { z } from 'zod';
import { getAdapter } from '../../services/sheetDb/adapter';
import { getAdminUsersTable } from '../../services/sheetDb/adminStats';
import {
  hashPassword,
  validatePasswordStrength,
} from '../../services/auth/password';
import { signAccessToken, signRefreshToken } from '../../services/auth/jwt';
import { isAdminEmail } from '../../utils/adminRole';
import { registerSchema } from './types';
import { logger } from '../../utils/logger';

/** POST /api/v1/auth/register — email+password signup, with account linking. */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet strength requirements',
        errors: strength.errors,
      });
      return;
    }

    const usersTable = await getAdminUsersTable();
    const existing = await usersTable.findOne({ where: { email } });
    const role = isAdminEmail(email) ? 'admin' : 'user';
    const passwordHash = await hashPassword(password);

    let actorSheetId: string;

    if (existing && existing.password_hash) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
      return;
    }

    if (existing) {
      // Account-linking backfill: this email previously registered via
      // Google only — same account, same sheet, just adding a password.
      actorSheetId = existing.actor_sheet_id as string;
      await usersTable.update({
        where: { email },
        data: {
          password_hash: passwordHash,
          name,
          role,
          last_login_at: new Date().toISOString(),
        },
      });
    } else {
      // No actorTokens available for a fresh password signup — sheet lands
      // in the admin's Drive (accepted asymmetry, see §4.3).
      const adapter = await getAdapter();
      actorSheetId = await adapter.createUserSheet(email, role, email, {
        extraFields: {
          password_hash: passwordHash,
          name,
          last_login_at: new Date().toISOString(),
        },
      });
    }

    const token = signAccessToken({
      email,
      name,
      spreadsheetId: actorSheetId,
      role,
    });
    const refreshToken = signRefreshToken({ email });

    logger.info(`User registered via email/password: ${email}`);

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: { email, name, role },
      message: 'Account created successfully',
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

    logger.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register',
    });
  }
}
