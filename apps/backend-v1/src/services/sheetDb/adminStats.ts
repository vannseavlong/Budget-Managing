import { getAdapter } from './adapter';
import { logger } from '../../utils/logger';

export type AppRole = 'admin' | 'user';

function adminContext(adapter: Awaited<ReturnType<typeof getAdapter>>) {
  return adapter.withContext({
    userId: 'system',
    actor: 'admin',
    actorSheetId: process.env.ADMIN_SHEET_ID!,
  });
}

/**
 * Records that a login happened. This is the only write path into the
 * admin-actor `user_stats` table — it never touches anything from the
 * user's own budget-data spreadsheet. Failures are logged and swallowed so
 * a Sheet-DB hiccup never blocks a user from logging in.
 */
export async function recordLogin(
  userId: string,
  email: string,
  role: AppRole
): Promise<void> {
  try {
    const adapter = await getAdapter();
    const ctx = adminContext(adapter);
    await ctx.table('user_stats').upsert({
      where: { user_id: userId },
      data: {
        user_id: userId,
        email,
        role,
        last_login_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to record login in admin user_stats table:', error);
  }
}

export interface UserStatsSummary {
  totalUsers: number;
  activeUsers: number;
  activeWindowDays: number;
}

/**
 * Aggregate stats for the admin dashboard. lsdb's `where` only supports
 * exact-match equality (no date-range operators), so the active-user
 * window is computed in application code after a findMany() — fine at the
 * "hundreds to low-thousands of rows" scale lsdb itself is designed for.
 */
export async function getUserStats(
  activeWindowDays = 30
): Promise<UserStatsSummary> {
  const adapter = await getAdapter();
  const ctx = adminContext(adapter);

  const rows = await ctx
    .table('user_stats')
    .findMany({ where: { role: 'user' } });

  const cutoff = Date.now() - activeWindowDays * 24 * 60 * 60 * 1000;
  const activeUsers = rows.filter((row) => {
    const lastLogin = row.last_login_at;
    return typeof lastLogin === 'string' && Date.parse(lastLogin) >= cutoff;
  }).length;

  return {
    totalUsers: rows.length,
    activeUsers,
    activeWindowDays,
  };
}
