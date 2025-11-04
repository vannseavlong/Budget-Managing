import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

const googleSheetsService = new GoogleSheetsService();

export async function validateDatabaseSchema(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;

    googleSheetsService.setCredentials(googleCredentials);

    const validation =
      await googleSheetsService.validateDatabaseSchema(spreadsheetId);

    res.status(200).json({
      success: true,
      validation,
    });
  } catch (error) {
    logger.error('Error validating database schema:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to validate database schema',
    });
  }
}
