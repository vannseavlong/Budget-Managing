import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toBudgetIncomeResponse } from './mappers';
import { createIncomeSchema } from './types';

/** POST /api/v1/budgets/incomes — multiple income sources per month allowed. */
export async function createIncome(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const validated = createIncomeSchema.parse(req.body);

    const incomesTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budget_incomes'
    );

    const created = await incomesTable.create({
      year: validated.year,
      month: validated.month,
      amount: validated.amount,
      source: validated.source || '',
    });

    res.status(201).json({
      success: true,
      data: toBudgetIncomeResponse(created as any, user.email),
      message: 'Income recorded successfully',
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

    logger.error('Error creating budget income:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create income',
    });
  }
}
