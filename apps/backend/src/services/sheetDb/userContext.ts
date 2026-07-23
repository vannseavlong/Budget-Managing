import { getAdapter } from './adapter';

/**
 * lsdb's `userId` here is just an opaque label used for its own internal
 * bookkeeping (schema-version tracking) — the actual data scoping comes
 * from `actorSheetId`. Using the user's email keeps this consistent with
 * what's already on the JWT, with no need for a separate id concept.
 */
export async function getUserTable(
  email: string,
  actorSheetId: string,
  tableName: string
) {
  const adapter = await getAdapter();
  return adapter
    .withContext({ userId: email, actor: 'user', actorSheetId })
    .table(tableName);
}
