import { Request, Response } from 'express';

/**
 * GET /api/v1/telegram/debug-no-auth — public, no auth. backend-v1 dumped
 * the entire process-wide in-memory `TelegramConnectionStore` here (every
 * user's connections in one shared `Map`). That global store no longer
 * exists by design — connections now live per-user inside each user's own
 * `telegram_connections` sheet, with no unauthenticated way to enumerate
 * across users — so this endpoint just reports that fact instead of
 * silently returning an empty/misleading list.
 */
export function debugNoAuth(req: Request, res: Response): void {
  res.json({
    success: true,
    message: 'Debug endpoint working without auth',
    data: {
      note:
        "backend-v1's in-memory TelegramConnectionStore no longer exists — " +
        "connections are persisted per-user in each user's own " +
        'telegram_connections sheet, so there is no global list to dump ' +
        'here anymore. Use GET /telegram/debug-connections (authenticated) ' +
        "to inspect the current user's connection.",
      timestamp: new Date().toISOString(),
    },
  });
}
