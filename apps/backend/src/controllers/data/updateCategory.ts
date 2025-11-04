import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import {
  categorySchema,
  setupUserCredentials,
  getUserSpreadsheetId,
} from './types';

const googleSheetsService = new GoogleSheetsService();

export async function updateCategory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    setupUserCredentials(req, googleSheetsService);
    const spreadsheetId = getUserSpreadsheetId(req);
    const { id } = req.params;

    const validatedData = categorySchema.partial().parse(req.body);

    await googleSheetsService.update(
      spreadsheetId,
      'categories',
      id,
      validatedData
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
    });
  } catch (error) {
    logger.error('Error updating category:', error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to update category',
    });
  }
}
