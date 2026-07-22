import { Request, Response } from 'express';
import { getUserStats } from '../../services/sheetDb/adminStats';
import { logger } from '../../utils/logger';

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const windowParam = req.query.activeWindowDays;
    const activeWindowDays =
      typeof windowParam === 'string' && Number.isFinite(Number(windowParam))
        ? Math.max(1, Math.min(365, Number(windowParam)))
        : 30;

    const stats = await getUserStats(activeWindowDays);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to fetch admin stats',
    });
  }
}
