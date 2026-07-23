import { createSheetAdapter, type SheetAdapter } from 'longcelot-sheet-db';
import { logger } from '../../utils/logger';
import usersSchema from './schemas/admin/users';
import categoriesSchema from './schemas/user/categories';
import transactionsSchema from './schemas/user/transactions';
import budgetsSchema from './schemas/user/budgets';
import budgetItemsSchema from './schemas/user/budgetItems';
import budgetIncomesSchema from './schemas/user/budgetIncomes';
import goalsSchema from './schemas/user/goals';
import telegramConnectionsSchema from './schemas/user/telegramConnections';
import telegramMessagesSchema from './schemas/user/telegramMessages';
import settingsSchema from './schemas/user/settings';

export interface AdminOAuthTokens {
  access_token: string;
  refresh_token: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

/**
 * The admin actor needs its own long-lived Google OAuth tokens to construct
 * the adapter (used for the central admin sheet and for createUserSheet's
 * admin-side bookkeeping). These are static config, not something the app
 * captures at runtime: run any lsdb CLI command once locally (e.g. `npx
 * lsdb doctor` from apps/backend/) to complete the interactive Google OAuth
 * login — it writes apps/backend/.lsdb-tokens.json — then copy that file's
 * contents into GOOGLE_ADMIN_TOKENS as a single-line JSON string. Google
 * refresh tokens don't expire on their own, so this only needs doing once
 * (redo it only if the token is revoked).
 */
function loadAdminTokens(): AdminOAuthTokens | null {
  const raw = process.env.GOOGLE_ADMIN_TOKENS;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminOAuthTokens;
  } catch {
    throw new Error(
      'GOOGLE_ADMIN_TOKENS is set but is not valid JSON — it should be the ' +
        'exact contents of apps/backend/.lsdb-tokens.json as a single line.'
    );
  }
}

let adapterPromise: Promise<SheetAdapter> | null = null;

export async function getAdapter(): Promise<SheetAdapter> {
  if (adapterPromise) return adapterPromise;

  adapterPromise = (async () => {
    const tokens = loadAdminTokens();
    if (!tokens) {
      throw new Error(
        'Sheet-DB admin adapter is not bootstrapped yet: set ' +
          'GOOGLE_ADMIN_TOKENS (see services/sheetDb/adapter.ts for how to ' +
          'obtain it) before admin-dependent features work.'
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
      // 'auto-sync': missing tabs/columns on a user's sheet get created
      // automatically instead of just logging a warning.
      onSchemaMismatch: 'auto-sync',
    });

    adapter.registerSchema(usersSchema);
    adapter.registerSchema(categoriesSchema);
    adapter.registerSchema(transactionsSchema);
    adapter.registerSchema(budgetsSchema);
    adapter.registerSchema(budgetItemsSchema);
    adapter.registerSchema(budgetIncomesSchema);
    adapter.registerSchema(goalsSchema);
    adapter.registerSchema(telegramConnectionsSchema);
    adapter.registerSchema(telegramMessagesSchema);
    adapter.registerSchema(settingsSchema);

    return adapter;
  })();

  adapterPromise.catch(() => {
    // Let a failed bootstrap be retried on the next call instead of
    // permanently caching the rejection.
    adapterPromise = null;
  });

  return adapterPromise;
}
