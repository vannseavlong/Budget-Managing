import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { updateSettingsSchema, toSettingsResponse } from './types';

/**
 * PUT /api/v1/settings — partial update of the user's one settings row.
 * Creates a default row first if one doesn't exist yet (mirrors GET's
 * behavior) so PUT never 404s on a brand-new user sheet.
 */
export async function updateSettings(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, spreadsheetId } = (req as AuthenticatedRequest).user!;
    const validatedData = updateSettingsSchema.parse(req.body);

    const settingsTable = await getUserTable(email, spreadsheetId, 'settings');

    let existing = await settingsTable.findOne({});
    if (!existing) {
      existing = await settingsTable.create({});
    }

    await settingsTable.update({
      where: { _id: existing._id },
      data: validatedData,
    });

    const updated = await settingsTable.findOne({
      where: { _id: existing._id },
    });

    res.status(200).json({
      success: true,
      data: toSettingsResponse(updated as any),
      message: 'Settings updated successfully',
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

    logger.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
    });
  }
}
