import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getUserTable } from '../../services/sheetDb/userContext';
import { logger } from '../../utils/logger';
import { listCategoriesQuerySchema } from './types';
import { toCategoryResponse, CategoryRecord } from './mapper';

/**
 * GET /api/v1/categories — supports the optional `search`/`sortBy`/
 * `sortOrder` query params apps/frontend's CategoriesService sends. lsdb's
 * `where` is exact-match only, so both are applied here in application code
 * after findMany({}). No `user_id` filter needed: actorSheetId already
 * scopes this table to exactly this user's own spreadsheet.
 */
export async function getCategories(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { spreadsheetId, email } = (req as AuthenticatedRequest).user!;
    const { search, sortBy, sortOrder } = listCategoriesQuerySchema.parse(
      req.query
    );

    const categoriesTable = await getUserTable(
      email,
      spreadsheetId,
      'categories'
    );
    let categories = await categoriesTable.findMany({});

    if (search) {
      const needle = search.toLowerCase();
      categories = categories.filter((category) =>
        String(category.name ?? '')
          .toLowerCase()
          .includes(needle)
      );
    }

    if (sortBy) {
      const field =
        sortBy === 'name'
          ? 'name'
          : `_${sortBy === 'createdAt' ? 'created_at' : 'updated_at'}`;
      const direction = sortOrder === 'desc' ? -1 : 1;
      categories = [...categories].sort((a, b) => {
        const aVal = String(a[field] ?? '');
        const bVal = String(b[field] ?? '');
        return aVal < bVal ? -direction : aVal > bVal ? direction : 0;
      });
    }

    res.status(200).json({
      success: true,
      data: categories.map((category) =>
        toCategoryResponse(category as CategoryRecord, email)
      ),
      message: 'Categories retrieved successfully',
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

    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
}
