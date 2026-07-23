import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { toCategoryResponse, CategoryRecord } from './mapper';

/** GET /api/v1/categories/:id */
export async function getCategory(req: Request, res: Response): Promise<void> {
  try {
    const { spreadsheetId, email } = (req as AuthenticatedRequest).user!;
    const { id } = req.params;

    const categoriesTable = await getUserTable(
      email,
      spreadsheetId,
      'categories'
    );
    const category = await categoriesTable.findOne({ where: { _id: id } });

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: toCategoryResponse(category as CategoryRecord, email),
      message: 'Category retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
    });
  }
}
