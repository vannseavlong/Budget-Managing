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
 * The `admin.users` table doubles as the account registry (auth) and the
 * source for aggregate stats — §5 folded the old separate `user_stats`
 * table into it, since `last_login_at` already lives here.
 */
export async function getAdminUsersTable() {
  const adapter = await getAdapter();
  return adminContext(adapter).table('users');
}

/**
 * Records that a login happened by bumping `last_login_at` on the existing
 * admin.users row. Failures are logged and swallowed so a Sheet-DB hiccup
 * never blocks a user from logging in.
 */
export async function recordLogin(email: string): Promise<void> {
  try {
    const usersTable = await getAdminUsersTable();
    await usersTable.update({
      where: { email },
      data: { last_login_at: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Failed to record login on admin.users:', error);
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
  const usersTable = await getAdminUsersTable();
  const rows = await usersTable.findMany({ where: { role: 'user' } });

  const cutoff = Date.now() - activeWindowDays * 24 * 60 * 60 * 1000;
  const activeUsers = rows.filter((row: any) => {
    const lastLogin = row.last_login_at;
    return typeof lastLogin === 'string' && Date.parse(lastLogin) >= cutoff;
  }).length;

  return {
    totalUsers: rows.length,
    activeUsers,
    activeWindowDays,
  };
}
