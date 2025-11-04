import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import {
  accountSchema,
  setupUserCredentials,
  getUserSpreadsheetId,
  getUserEmail,
} from './types';

const googleSheetsService = new GoogleSheetsService();

export async function createAccount(
  req: Request,
  res: Response
): Promise<void> {
  try {
    setupUserCredentials(req, googleSheetsService);
    const spreadsheetId = getUserSpreadsheetId(req);
    const userEmail = getUserEmail(req);

    const validatedData = accountSchema.parse(req.body);
    const accountData = {
      ...validatedData,
      user_id: userEmail,
    };

    const accountId = await googleSheetsService.insert(
      spreadsheetId,
      'accounts',
      accountData
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { id: accountId, ...accountData },
    });
  } catch (error) {
    logger.error('Error creating account:', error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to create account',
    });
  }
}
