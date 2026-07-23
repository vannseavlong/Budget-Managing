import { Request, Response } from 'express';
import { z } from 'zod';
import { getAdminUsersTable } from '../../services/sheetDb/adminStats';
import { signAccessToken, verifyRefreshToken } from '../../services/auth/jwt';
import { isAdminEmail } from '../../utils/adminRole';
import { refreshSchema } from './types';
import { logger } from '../../utils/logger';

/**
 * POST /api/v1/auth/refresh — real implementation this time (backend-v1's
 * was a stub that never issued a new token). Matches
 * apps/frontend/lib/http-client.ts's interceptor exactly: `{refreshToken}`
 * in, `{token}` out.
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    let email: string;
    try {
      ({ email } = verifyRefreshToken(refreshToken));
    } catch {
      res
        .status(401)
        .json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    const usersTable = await getAdminUsersTable();
    const user = await usersTable.findOne({ where: { email } });
    if (!user) {
      res
        .status(401)
        .json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    const token = signAccessToken({
      email,
      name: user.name as string,
      spreadsheetId: user.actor_sheet_id as string,
      role: isAdminEmail(email) ? 'admin' : 'user',
    });

    res.status(200).json({ success: true, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
      return;
    }

    logger.error('Error refreshing token:', error);
    res.status(401).json({
      success: false,
      message: 'Failed to refresh token',
    });
  }
}
