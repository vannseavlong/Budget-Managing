import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createCategorySchema } from './types';

/**
 * Create a new category
 */
export async function createCategory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const { spreadsheetId, googleCredentials } = authenticatedReq.user!;
    const validatedData = createCategorySchema.parse(req.body);

    const googleSheetsService = new GoogleSheetsService();
    googleSheetsService.setCredentials(googleCredentials);

    // Check if category with same name already exists for this user
    const existingCategories = await googleSheetsService.find(
      spreadsheetId,
      'categories',
      {
        user_id: authenticatedReq.user!.email,
        name: validatedData.name,
      }
    );

    if (existingCategories.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
      return;
    }

    // Create new category
    const newCategory = {
      id: uuidv4(),
      name: validatedData.name,
      color: validatedData.color,
      user_id: authenticatedReq.user!.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert into Google Sheets
    await googleSheetsService.insert(spreadsheetId, 'categories', newCategory);

    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Category created successfully',
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

    logger.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
