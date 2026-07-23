import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toBudgetIncomeResponse } from './mappers';
import { updateIncomeSchema } from './types';

/** PUT /api/v1/budgets/incomes/:id */
export async function updateIncome(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const { id } = req.params;
    const validated = updateIncomeSchema.parse(req.body);

    const incomesTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budget_incomes'
    );

    const existing = await incomesTable.findOne({ where: { _id: id } });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Income not found',
      });
      return;
    }

    const data = {
      year: validated.year,
      month: validated.month,
      amount: validated.amount,
      source: validated.source || '',
    };

    await incomesTable.update({ where: { _id: id }, data });

    const updated = await incomesTable.findOne({ where: { _id: id } });

    res.status(200).json({
      success: true,
      data: toBudgetIncomeResponse(updated as any, user.email),
      message: 'Income updated successfully',
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
      message: 'Failed to update income',
    });
  }
}
