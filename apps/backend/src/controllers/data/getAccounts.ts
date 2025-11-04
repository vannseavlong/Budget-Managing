import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import {
  setupUserCredentials,
  getUserSpreadsheetId,
  getUserEmail,
} from './types';

const googleSheetsService = new GoogleSheetsService();

export async function getAccounts(req: Request, res: Response): Promise<void> {
  try {
    setupUserCredentials(req, googleSheetsService);
    const spreadsheetId = getUserSpreadsheetId(req);
    const userEmail = getUserEmail(req);

    const accounts = await googleSheetsService.find(spreadsheetId, 'accounts', {
      user_id: userEmail,
    });

    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    logger.error('Error getting accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get accounts',
    });
  }
}
