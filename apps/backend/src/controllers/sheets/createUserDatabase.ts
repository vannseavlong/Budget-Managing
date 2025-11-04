import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { createSpreadsheetSchema } from './types';
import { z } from 'zod';

const googleSheetsService = new GoogleSheetsService();

export async function createUserDatabase(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const validatedData = createSpreadsheetSchema.parse(req.body);
    const userEmail = req.user?.email;

    if (!userEmail) {
      res.status(401).json({
        success: false,
        message: 'User email not found in token',
      });
      return;
    }

    // Implementation placeholder - will create the actual spreadsheet
    const spreadsheetId =
      await googleSheetsService.getOrCreateUserDatabase(userEmail);

    res.status(201).json({
      success: true,
      data: {
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        name: validatedData.name || `Budget Manager - ${userEmail}`,
        template: validatedData.template,
      },
      message: 'Google Sheets database created successfully',
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

    logger.error('Error creating Google Sheets database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Google Sheets database',
    });
  }
}
