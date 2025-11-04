import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { BudgetQueryParams } from './types';

/**
 * Get all budgets for the authenticated user
 */
export async function getBudgets(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { year, month } = req.query as any as BudgetQueryParams;

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Build filter criteria
    const filterCriteria: any = {
      user_id: authenticatedReq.user!.email,
    };

    if (year) {
      filterCriteria.year = year.toString();
    }

    if (month) {
      filterCriteria.month = month.toString();
    }

    // Get all budgets for this user with filters
    const budgets = await googleSheetsService.find(
      spreadsheetId,
      'budgets',
      filterCriteria
    );

    // Sort by year and month (newest first)
    budgets.sort((a: any, b: any) => {
      const yearDiff = parseInt(b.year) - parseInt(a.year);
      if (yearDiff !== 0) return yearDiff;
      return parseInt(b.month) - parseInt(a.month);
    });

    res.status(200).json({
      success: true,
      data: budgets,
      message: 'Budgets retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting budgets:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
