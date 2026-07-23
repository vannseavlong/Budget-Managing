import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';

/**
 * GET|POST /api/v1/sheets/connect
 *
 * In this architecture a user's Google Sheet is provisioned automatically
 * at registration time (`createUserSheet`, see the auth domain) — there is
 * no separate "connect a sheet" step to perform. This endpoint is kept for
 * frontend parity with `apps/frontend/lib/api-config.ts`'s `SHEETS.CONNECT`
 * (currently unused by any page) and simply confirms the sheet that's
 * already attached to the authenticated user, rather than pretending to
 * perform a connection action that doesn't exist.
 */
export async function connect(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res
        .status(401)
        .json({ success: false, message: 'User not authenticated' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        connected: true,
        spreadsheetId: user.spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${user.spreadsheetId}`,
      },
      message: 'Your Google Sheet is already connected',
    });
  } catch (error) {
    logger.error('Error confirming sheet connection:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to confirm sheet connection',
    });
  }
}
