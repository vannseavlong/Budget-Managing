import { getUserTable } from '../../services/sheetDb/userContext';
import { getAdminUsersTable } from '../../services/sheetDb/adminStats';
import { logger } from '../../utils/logger';

/**
 * Replaces backend-v1's `TelegramConnectionStore` (a module-level `Map`,
 * explicitly documented there as temporary and not surviving process
 * restarts or multi-instance deployment) with real persistence in each
 * user's own `telegram_connections` sheet.
 *
 * Both write paths — the authenticated `POST /telegram/connect` route and
 * the public `/start connect_<email>` webhook deep-link handler — funnel
 * through `upsertTelegramConnectionByEmail` below so the persistence logic
 * only exists once.
 */

export type TelegramConnectionStatus = 'connected' | 'pending' | 'disconnected';

export interface UpsertConnectionInput {
  chatId: string;
  telegramUsername?: string;
  status?: TelegramConnectionStatus;
}

export interface UpsertConnectionResult {
  actorSheetId: string;
  connection: Record<string, unknown>;
}

/**
 * Resolves a user's email to their actor sheet id via the admin `users`
 * registry. This lookup is unavoidable for the webhook path (Telegram's
 * webhook carries no JWT, only whatever email we decode out of the
 * `/start connect_<email>` payload) and is skipped for already-authenticated
 * callers that pass `actorSheetIdHint`.
 */
export async function resolveActorSheetId(
  email: string
): Promise<string | null> {
  const usersTable = await getAdminUsersTable();
  const user = await usersTable.findOne({ where: { email } });
  return user ? (user.actor_sheet_id as string) : null;
}

/**
 * Single shared persistence path for linking a Telegram chat to a user's
 * account. Upserts by `chat_id` — reconnecting the same Telegram chat
 * updates the existing row instead of creating a duplicate. Returns `null`
 * if `email` isn't a registered account (the webhook path can hit this if
 * a stale/garbled deep link is used).
 */
export async function upsertTelegramConnectionByEmail(
  email: string,
  input: UpsertConnectionInput,
  actorSheetIdHint?: string
): Promise<UpsertConnectionResult | null> {
  const actorSheetId = actorSheetIdHint ?? (await resolveActorSheetId(email));
  if (!actorSheetId) {
    logger.warn(
      `No registered user found for email while linking Telegram connection: ${email}`
    );
    return null;
  }

  const table = await getUserTable(email, actorSheetId, 'telegram_connections');
  const now = new Date().toISOString();

  const connection = await table.upsert({
    where: { chat_id: input.chatId },
    data: {
      chat_id: input.chatId,
      telegram_username: input.telegramUsername,
      status: input.status ?? 'connected',
      connected_at: now,
    },
  });

  return { actorSheetId, connection };
}

/** Finds the current connected row (if any) for the authenticated user. */
export async function findActiveTelegramConnection(
  email: string,
  actorSheetId: string
): Promise<Record<string, unknown> | null> {
  const table = await getUserTable(email, actorSheetId, 'telegram_connections');
  return table.findOne({ where: { status: 'connected' } });
}

/**
 * Removes every currently-connected row for this user — mirrors
 * `TelegramConnectionStore.removeConnection`'s full removal. Neither
 * telegram table has `softDelete`, so this is a real delete.
 */
export async function disconnectAllTelegramConnections(
  email: string,
  actorSheetId: string
): Promise<number> {
  const table = await getUserTable(email, actorSheetId, 'telegram_connections');
  const rows = await table.findMany({ where: { status: 'connected' } });

  let removed = 0;
  for (const row of rows) {
    await table.delete({ where: { chat_id: row.chat_id as string } });
    removed += 1;
  }
  return removed;
}
