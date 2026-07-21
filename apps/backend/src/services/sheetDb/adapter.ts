import { createSheetAdapter, type SheetAdapter } from 'longcelot-sheet-db';
import { getRedisClient } from '../redisClient';
import { logger } from '../../utils/logger';
import userStatsSchema from './schemas/admin/userStats';
import categoriesSchema from './schemas/user/categories';
import transactionsSchema from './schemas/user/transactions';
import budgetsSchema from './schemas/user/budgets';
import budgetItemsSchema from './schemas/user/budgetItems';
import budgetIncomesSchema from './schemas/user/budgetIncomes';
import goalsSchema from './schemas/user/goals';
import telegramMessagesSchema from './schemas/user/telegramMessages';

const ADMIN_TOKENS_REDIS_KEY = 'lsdb:admin-tokens';

export interface AdminOAuthTokens {
  access_token: string;
  refresh_token: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

export async function storeAdminTokens(
  tokens: AdminOAuthTokens
): Promise<void> {
  const redis = await getRedisClient();
  await redis.set(ADMIN_TOKENS_REDIS_KEY, JSON.stringify(tokens));
  adapterPromise = null; // force rebuild with the new tokens next time it's requested
  logger.info('Stored admin Google OAuth tokens for the sheet-db adapter');
}

async function loadAdminTokens(): Promise<AdminOAuthTokens | null> {
  const redis = await getRedisClient();
  const raw = await redis.get(ADMIN_TOKENS_REDIS_KEY);
  return raw ? (JSON.parse(raw) as AdminOAuthTokens) : null;
}

let adapterPromise: Promise<SheetAdapter> | null = null;

/**
 * The admin actor needs its own long-lived Google OAuth tokens to construct
 * the adapter (used for the central admin sheet and for createUserSheet's
 * admin-side bookkeeping). Those tokens are captured the first time the
 * SUPER_ADMIN_EMAIL account logs in through the normal OAuth callback (see
 * controllers/auth/handleCallback.ts) and cached in Redis from then on.
 */
export async function getAdapter(): Promise<SheetAdapter> {
  if (adapterPromise) return adapterPromise;

  adapterPromise = (async () => {
    const tokens = await loadAdminTokens();
    if (!tokens) {
      throw new Error(
        'Sheet-DB admin adapter is not bootstrapped yet: the admin account ' +
          '(SUPER_ADMIN_EMAIL) needs to sign in once through the normal ' +
          'Google OAuth flow before admin-dependent features work.'
      );
    }

    const adminSheetId = process.env.ADMIN_SHEET_ID;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!adminSheetId || !clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Missing lsdb configuration: ADMIN_SHEET_ID, GOOGLE_CLIENT_ID, ' +
          'GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI must all be set.'
      );
    }

    const adapter = createSheetAdapter({
      adminSheetId,
      credentials: { clientId, clientSecret, redirectUri },
      tokens,
      // 'auto-sync' mirrors the old hand-rolled ensure*Schema()/
      // ensureAllSheetsExist() calls that ran defensively before every
      // request — missing tabs/columns get created automatically instead
      // of just logging a warning.
      onSchemaMismatch: 'auto-sync',
    });

    adapter.registerSchema(userStatsSchema);
    adapter.registerSchema(categoriesSchema);
    adapter.registerSchema(transactionsSchema);
    adapter.registerSchema(budgetsSchema);
    adapter.registerSchema(budgetItemsSchema);
    adapter.registerSchema(budgetIncomesSchema);
    adapter.registerSchema(goalsSchema);
    adapter.registerSchema(telegramMessagesSchema);

    return adapter;
  })();

  adapterPromise.catch(() => {
    // Let a failed bootstrap be retried on the next call instead of
    // permanently caching the rejection.
    adapterPromise = null;
  });

  return adapterPromise;
}
