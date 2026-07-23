import { Request, Response } from 'express';

/**
 * POST /api/v1/categories/migrate-emojis — legacy one-off backfill utility
 * (see docs/BACKEND_REBUILD_PLAN.md). This is a fresh lsdb-only system with
 * no pre-existing emoji-less category data to migrate, so this is a
 * deliberate no-op that exists only so the frontend call doesn't 404.
 */
export async function migrateCategoriesEmoji(
  _req: Request,
  res: Response
): Promise<void> {
  res.status(200).json({
    success: true,
    data: { migrated: 0 },
    message: 'No legacy data to migrate',
  });
}
