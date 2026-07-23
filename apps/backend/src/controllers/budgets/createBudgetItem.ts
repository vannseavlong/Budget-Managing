import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toBudgetItemResponse } from './mappers';
import { createBudgetItemSchema } from './types';

/**
 * POST /api/v1/budgets/items
 *
 * category_id is trusted as-is (no ref() on the schema, no lookup here) —
 * see the comment on budget_items.category_id in
 * services/sheetDb/schemas/user/budgetItems.ts.
 */
export async function createBudgetItem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user!;
    const validated = createBudgetItemSchema.parse(req.body);

    const budgetsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budgets'
    );

    const budget = await budgetsTable.findOne({
      where: { _id: validated.budget_id },
    });

    if (!budget) {
      res.status(400).json({
        success: false,
        message: 'Invalid budget ID or budget does not belong to user',
      });
      return;
    }

    const budgetItemsTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'budget_items'
    );

    const created = await budgetItemsTable.create({
      budget_id: validated.budget_id,
      category_id: validated.category_id,
      category_name: validated.category_name,
      amount: validated.amount,
      spent: 0,
    });

    res.status(201).json({
      success: true,
      data: toBudgetItemResponse(created as any, user.email),
      message: 'Budget item created successfully',
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

    logger.error('Error creating budget item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget item',
    });
  }
}
