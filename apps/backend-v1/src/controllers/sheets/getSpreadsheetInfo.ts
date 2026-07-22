import { Request, Response } from 'express';
import { logger } from '../../utils/logger';

export async function getSpreadsheetInfo(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const spreadsheetId = req.user?.spreadsheetId;

    if (!spreadsheetId) {
      res.status(404).json({
        success: false,
        message: 'No spreadsheet found for user',
      });
      return;
    }

    // Implementation placeholder - will get actual spreadsheet info
    res.status(200).json({
      success: true,
      data: {
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        title: 'Budget Manager Database',
        sheets: [
          'users',
          'settings',
          'categories',
          'transactions',
          'budgets',
          'budget_items',
          'goals',
          'telegram_messages',
        ],
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
      },
      message: 'Spreadsheet information retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting spreadsheet info:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
