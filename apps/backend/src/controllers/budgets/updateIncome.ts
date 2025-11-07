import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { z } from 'zod';

const updateIncomeSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  amount: z.number().min(0),
  source: z.string().optional(),
});

/**
 * Update an existing income entry
 */
export async function updateIncome(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const { id } = req.params;
    const validated = updateIncomeSchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Ensure the incomes table exists
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

    // Verify ownership
    const existing = await googleSheetsService.find(
      spreadsheetId,
      'budget_incomes',
      { id, user_id: authenticatedReq.user!.email }
    );

    if (!existing || existing.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Income not found',
      });
      return;
    }

    const updatedRecord = {
      year: validated.year,
      month: validated.month,
      amount: validated.amount,
      source: validated.source || '',
    };

    await googleSheetsService.update(
      spreadsheetId,
      'budget_incomes',
      id,
      updatedRecord
    );

    res.status(200).json({
      success: true,
      data: { id, ...updatedRecord },
      message: 'Income updated',
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
    logger.error('Error updating income:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
