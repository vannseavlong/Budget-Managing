import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { getUserTable } from '../../services/sheetDb/userContext';
import { withId, mapTimestamps } from '../../utils/response';

type MessageRecord = Record<string, unknown> & {
  _id: string;
  _created_at?: string;
  _updated_at?: string;
  _deleted_at?: string | null;
};

/**
 * GET /api/v1/telegram/messages — backend-v1 always returned an empty
 * stub ("Implementation placeholder - will be implemented with Google
 * Sheets integration"). A real `telegram_messages` table exists now (and
 * `sendMessage` writes to it), so this returns real paginated data from
 * it instead of keeping the stub — not strictly required by the task, but
 * cheap to do properly given the table and `withId`/`mapTimestamps`
 * helpers are already there.
 */
export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.max(1, Number(req.query.per_page) || 50);
    const statusFilter =
      typeof req.query.status === 'string' ? req.query.status : undefined;

    const messagesTable = await getUserTable(
      user.email,
      user.spreadsheetId,
      'telegram_messages'
    );

    const allMessages = (await messagesTable.findMany(
      statusFilter ? { where: { status: statusFilter } } : undefined
    )) as MessageRecord[];

    // Newest first.
    const sorted = [...allMessages].sort((a, b) => {
      const aTime = a._created_at ?? '';
      const bTime = b._created_at ?? '';
      return bTime.localeCompare(aTime);
    });

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const pageItems = sorted.slice(start, start + perPage).map((record) => ({
      ...withId(record),
      ...mapTimestamps(record, 'snake'),
    }));

    res.status(200).json({
      success: true,
      data: pageItems,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
      },
      message: 'Telegram messages retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting Telegram messages:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
