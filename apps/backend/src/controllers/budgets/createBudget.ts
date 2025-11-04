import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createBudgetSchema } from './types';

/**
 * Create a new budget
 */
export async function createBudget(req: Request, res: Response): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const validatedData = createBudgetSchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Check if budget for same year/month already exists for this user
    const existingBudgets = await googleSheetsService.find(
      spreadsheetId,
      'budgets',
      {
        user_id: authenticatedReq.user!.email,
        year: validatedData.year.toString(),
        month: validatedData.month.toString(),
      }
    );

    if (existingBudgets.length > 0) {
      res.status(400).json({
        success: false,
        message: `Budget for ${validatedData.year}/${validatedData.month} already exists`,
      });
      return;
    }

    // Create new budget
    const newBudget = {
      id: uuidv4(),
      year: validatedData.year,
      month: validatedData.month,
      income: validatedData.income,
      user_id: authenticatedReq.user!.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert into Google Sheets
    await googleSheetsService.insert(spreadsheetId, 'budgets', newBudget);

    res.status(201).json({
      success: true,
      data: newBudget,
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
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
