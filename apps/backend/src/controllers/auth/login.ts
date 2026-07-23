import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getAdminUsersTable,
  recordLogin,
} from '../../services/sheetDb/adminStats';
import { comparePassword } from '../../services/auth/password';
import { signAccessToken, signRefreshToken } from '../../services/auth/jwt';
import { isAdminEmail } from '../../utils/adminRole';
import { loginSchema } from './types';
import { logger } from '../../utils/logger';

/** POST /api/v1/auth/login — email+password login. */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const usersTable = await getAdminUsersTable();
    const existing = await usersTable.findOne({ where: { email } });

    // 401 on any mismatch — don't leak whether the email or the password
    // was the wrong part.
    if (!existing || !existing.password_hash) {
      res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const valid = await comparePassword(
      password,
      existing.password_hash as string
    );
    if (!valid) {
      res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const role = isAdminEmail(email) ? 'admin' : 'user';
    await recordLogin(email);

    const token = signAccessToken({
      email,
      name: existing.name as string,
      spreadsheetId: existing.actor_sheet_id as string,
      role,
    });
    const refreshToken = signRefreshToken({ email });

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: { email, name: existing.name, role },
      message: 'Logged in successfully',
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

    logger.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log in',
    });
  }
}
