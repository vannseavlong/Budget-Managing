import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';

/**
 * POST /api/v1/sheets/disconnect
 *
 * There's no real "disconnect" concept when the user's Google Sheet *is*
 * their account's data store (not an optional integration bolted onto some
 * other primary database) — actually disconnecting it would mean deleting
 * or orphaning the user's only copy of their data, which isn't something a
 * single unauthenticated-intent POST should silently do. Rather than fake
 * a destructive action it doesn't perform, this returns a 200 that clearly
 * states nothing happened and why, so a caller can't mistake it for real
 * confirmation of data loss.
 */
export async function disconnect(
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
        disconnected: false,
        spreadsheetId: user.spreadsheetId,
      },
      message:
        "Disconnecting is not supported: your Google Sheet is your account's " +
        'primary data store, not an optional integration, so there is nothing ' +
        'to safely disconnect without deleting your data. No action was taken.',
    });
  } catch (error) {
    logger.error('Error handling sheet disconnect request:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to process disconnect request',
    });
  }
}
