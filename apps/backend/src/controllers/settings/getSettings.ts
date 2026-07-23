import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toSettingsResponse } from './types';

/**
 * GET /api/v1/settings — one settings row per user sheet. If none exists
 * yet (e.g. a brand-new user), create a default row (all schema `.default()`
 * values apply) and return that instead of 404ing.
 */
export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const { email, spreadsheetId } = (req as AuthenticatedRequest).user!;

    const settingsTable = await getUserTable(email, spreadsheetId, 'settings');

    let settings = await settingsTable.findOne({});
    if (!settings) {
      settings = await settingsTable.create({});
    }

    res.status(200).json({
      success: true,
      data: toSettingsResponse(settings as any),
      message: 'Settings retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings',
    });
  }
}
