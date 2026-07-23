import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toBudgetResponse } from './mappers';
import { createBudgetSchema } from './types';

/** POST /api/v1/budgets — dedupes on {year, month} per user. */
export async function createBudget(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const validated = createBudgetSchema.parse(req.body);

    const budgetsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budgets'
    );

    const existing = await budgetsTable.findMany({
      where: { year: validated.year, month: validated.month },
    });

    if (existing.length > 0) {
      res.status(400).json({
        success: false,
        message: `Budget for ${validated.year}/${validated.month} already exists`,
      });
      return;
    }

    const created = await budgetsTable.create({
      year: validated.year,
      month: validated.month,
      income: validated.income,
    });

    res.status(201).json({
      success: true,
      data: toBudgetResponse(created as any, user.email),
      message: 'Budget created successfully',
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

    logger.error('Error creating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget',
    });
  }
}
