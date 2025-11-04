import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import {
  setupUserCredentials,
  getUserSpreadsheetId,
  getUserEmail,
} from './types';

const googleSheetsService = new GoogleSheetsService();

export async function getCategories(
  req: Request,
  res: Response
): Promise<void> {
  try {
    setupUserCredentials(req, googleSheetsService);
    const spreadsheetId = getUserSpreadsheetId(req);
    const userEmail = getUserEmail(req);

    const categories = await googleSheetsService.find(
      spreadsheetId,
      'categories',
      {
        user_id: userEmail,
      }
    );

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
    });
  }
}
