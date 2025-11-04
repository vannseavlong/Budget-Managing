import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
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
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const validatedData = createBudgetItemSchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Verify the budget exists and belongs to this user
    const budget = await googleSheetsService.findById(
      spreadsheetId,
      'budgets',
      validatedData.budget_id
    );

    if (!budget || budget.user_id !== authenticatedReq.user!.email) {
      res.status(400).json({
        success: false,
        message: 'Invalid budget ID or budget does not belong to user',
      });
      return;
    }

    // Verify the category exists and belongs to this user
    const category = await googleSheetsService.findById(
      spreadsheetId,
      'categories',
      validatedData.category_id
    );

    if (!category || category.user_id !== authenticatedReq.user!.email) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID or category does not belong to user',
      });
      return;
    }

    // Check if budget item for this category already exists in this budget
    const existingBudgetItems = await googleSheetsService.find(
      spreadsheetId,
      'budget_items',
      {
        user_id: authenticatedReq.user!.email,
        budget_id: validatedData.budget_id,
        category_id: validatedData.category_id,
      }
    );

    if (existingBudgetItems.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Budget item for this category already exists in this budget',
      });
      return;
    }

    // Create new budget item
    const newBudgetItem = {
      id: uuidv4(),
      budget_id: validatedData.budget_id,
      category_id: validatedData.category_id,
      category_name: validatedData.category_name,
      amount: validatedData.amount,
      spent: 0, // Initialize spent amount to 0
      user_id: authenticatedReq.user!.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert into Google Sheets
    await googleSheetsService.insert(
      spreadsheetId,
      'budget_items',
      newBudgetItem
    );

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
