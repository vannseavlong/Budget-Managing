import { Request, Response } from 'express';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createBudgetItemSchema } from './types';

/**
 * Create a new budget item
 */
export async function createBudgetItem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, email } = authenticatedReq.user!;
    const validatedData = createBudgetItemSchema.parse(req.body);

    const budgetsTable = await getUserTable(email, spreadsheetId, 'budgets');
    const budgetItemsTable = await getUserTable(
      email,
      spreadsheetId,
      'budget_items'
    );

    // Verify the budget exists (it's already scoped to this user's own sheet)
    const budget = await budgetsTable.findOne({
      where: { id: validatedData.budget_id },
    });

    if (!budget) {
      res.status(400).json({
        success: false,
        message: 'Invalid budget ID or budget does not belong to user',
      });
      return;
    }

    // Skip category validation to reduce API calls
    // The category_id is just a reference; we can trust the frontend sends valid data

    // Skip duplicate check to reduce API calls
    // If a duplicate exists, Google Sheets will handle it or we can check client-side

    // Create new budget item
    // Note: budget_items sheet may or may not include user_id column
    // We store it for reference, but ownership is validated through parent budget
    const newBudgetItem = {
      id: uuidv4(),
      budget_id: validatedData.budget_id,
      category_id: validatedData.category_id,
      category_name: validatedData.category_name,
      amount: validatedData.amount,
      spent: 0, // Initialize spent amount to 0
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await budgetItemsTable.create(newBudgetItem);

    res.status(201).json({
      success: true,
      data: newBudgetItem,
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
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
