import { Request, Response } from 'express';

/**
 * GET /api/v1/telegram/connect-success — ported verbatim from backend-v1,
 * including its position in the route file: *after*
 * `router.use(authenticateToken)`. That's almost certainly a pre-existing
 * ordering bug there — this is meant to be hit as a redirect target
 * straight from the bot, not from a browser that's already carrying this
 * app's own JWT — but the task calls for matching backend-v1's exact route
 * ordering, so it's preserved as-is here rather than silently fixed.
 */
export function connectSuccess(req: Request, res: Response): void {
  const { user_email, telegram_username, chat_id } = req.query;

  if (!user_email || !telegram_username || !chat_id) {
    res.status(400).json({
      success: false,
      message: 'Missing required parameters',
    });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectUrl = `${frontendUrl}/settings?telegram_connected=true&username=${encodeURIComponent(
    telegram_username as string
  )}`;

  res.redirect(redirectUrl);
}
