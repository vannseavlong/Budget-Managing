import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createIncomeSchema } from './types';

/**
 * Create a new budget income entry (allow multiple income sources per month)
 */
export async function createBudgetIncome(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const validated = createIncomeSchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    const newRecord = {
      id: uuidv4(),
      user_id: authenticatedReq.user!.email,
      year: validated.year,
      month: validated.month,
      amount: validated.amount,
      source: validated.source || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Ensure the incomes table exists and has headers
    await googleSheetsService.ensureTableExists(spreadsheetId, {
      name: 'budget_incomes',
      columns: [
        'id',
        'user_id',
        'year',
        'month',
        'amount',
        'source',
        'created_at',
        'updated_at',
      ],
    });

    await googleSheetsService.insert(
      spreadsheetId,
      'budget_incomes',
      newRecord
    );
    res
      .status(201)
      .json({ success: true, data: newRecord, message: 'Income recorded' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      return;
    }
    logger.error('Error creating budget income:', error);
    res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Internal server error',
      });
  }
}
