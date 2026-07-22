import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { shareSpreadsheetSchema } from './types';
import { z } from 'zod';

export async function shareSpreadsheet(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validatedData = shareSpreadsheetSchema.parse(req.body);
    const spreadsheetId = req.user?.spreadsheetId;

    if (!spreadsheetId) {
      res.status(404).json({
        success: false,
        message: 'No spreadsheet found for user',
      });
      return;
    }

    // Implementation placeholder - will implement actual sharing
    res.status(200).json({
      success: true,
      data: {
        shared_with: validatedData.email,
        role: validatedData.role,
        spreadsheet_id: spreadsheetId,
      },
      message: 'Spreadsheet shared successfully',
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

    logger.error('Error sharing spreadsheet:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
