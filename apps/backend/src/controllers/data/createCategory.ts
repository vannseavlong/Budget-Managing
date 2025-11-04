import { Request, Response } from 'express';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { logger } from '../../utils/logger';
import {
  categorySchema,
  setupUserCredentials,
  getUserSpreadsheetId,
  getUserEmail,
} from './types';

const googleSheetsService = new GoogleSheetsService();

export async function createCategory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    setupUserCredentials(req, googleSheetsService);
    const spreadsheetId = getUserSpreadsheetId(req);
    const userEmail = getUserEmail(req);

    const validatedData = categorySchema.parse(req.body);
    const categoryData = {
      ...validatedData,
      user_id: userEmail, // Using email as user identifier
      color: validatedData.color || '#3B82F6',
    };

    const categoryId = await googleSheetsService.insert(
      spreadsheetId,
      'categories',
      categoryData
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { id: categoryId, ...categoryData },
    });
  } catch (error) {
    logger.error('Error creating category:', error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to create category',
    });
  }
}
