import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';

const googleSheetsService = new GoogleSheetsService();

export async function setupDatabaseSchema(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials, email } = authenticatedReq.user!;

    googleSheetsService.setCredentials(googleCredentials);

    // Create the database schema with proper tables
    await googleSheetsService.createDatabaseSchema(spreadsheetId);

    logger.info(`Database schema setup completed for user: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Database schema setup completed successfully',
      spreadsheetId,
      tables: [
        'users',
        'settings',
        'categories',
        'transactions',
        'budgets',
        'budget_items',
        'budget_incomes',
        'goals',
        'telegram_messages',
      ],
    });
  } catch (error) {
    logger.error('Error setting up database schema:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to setup database schema',
    });
  }
}
