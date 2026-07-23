import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { getAdapter } from '../../services/sheetDb/adapter';
import { logger } from '../../utils/logger';
import { USER_SCHEMAS } from './schemas';

/**
 * POST /api/v1/sheets/sync
 *
 * Real, useful work (unlike connect/disconnect): walks every user-actor
 * table schema and calls `adapter.syncSchema(schema)` against the
 * authenticated user's own sheet, creating any missing tabs and appending
 * any missing header columns. This is the manual escape hatch for a user
 * whose sheet fell behind — normal requests already self-heal via
 * `onSchemaMismatch: 'auto-sync'` on the shared adapter (see adapter.ts),
 * but a user who hasn't hit an affected table yet, or whose auto-sync
 * failed silently, has no other way to force a re-check.
 *
 * `withContext` is required before `syncSchema` — the adapter resolves
 * which spreadsheet a user-actor schema targets from the *current*
 * context's `actorSheetId` (see `resolveSpreadsheetId` in
 * `longcelot-sheet-db`'s SheetAdapter), not from an argument to
 * `syncSchema` itself.
 */
export async function sync(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res
        .status(401)
        .json({ success: false, message: 'User not authenticated' });
      return;
    }

    const adapter = await getAdapter();
    const scopedAdapter = adapter.withContext({
      userId: user.email,
      actor: 'user',
      actorSheetId: user.spreadsheetId,
    });

    const synced: string[] = [];
    const failed: { table: string; error: string }[] = [];

    for (const schema of USER_SCHEMAS) {
      try {
        await scopedAdapter.syncSchema(schema);
        synced.push(schema.name);
      } catch (error) {
        logger.error(
          `Error syncing schema '${schema.name}' for ${user.email}:`,
          error
        );
        failed.push({
          table: schema.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Always 200 here (not e.g. 207) to match this codebase's plain
    // 200/4xx/500 convention — per-table outcomes are reported in `data`
    // instead, since a partial sync is still a real, actionable result
    // rather than a request-level failure.
    res.status(200).json({
      success: failed.length === 0,
      data: {
        spreadsheetId: user.spreadsheetId,
        synced,
        failed,
      },
      message:
        failed.length === 0
          ? 'Sheet schema is up to date'
          : 'Sheet schema sync completed with some failures',
    });
  } catch (error) {
    logger.error('Error syncing sheet schema:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to sync sheet schema',
    });
  }
}
