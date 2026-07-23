import { getAdapter } from './adapter';

type ContextualAdapter = ReturnType<
  Awaited<ReturnType<typeof getAdapter>>['withContext']
>;

// lsdb's withContext() unconditionally kicks off a schema-version check
// (one Sheets API read per registered user table) whenever it builds a
// fresh non-admin context. Calling withContext() again on every request —
// which every one of a page load's several endpoints does independently —
// re-runs that full check every time and burns through Google's per-user
// Sheets read quota in minutes. The schema can't change without a redeploy
// (which clears this cache), so checking once per process per sheet is
// enough — cache the context object instead of rebuilding it per call.
const contextCache = new Map<string, ContextualAdapter>();

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

  let ctx = contextCache.get(actorSheetId);
  if (!ctx) {
    ctx = adapter.withContext({ userId: email, actor: 'user', actorSheetId });
    contextCache.set(actorSheetId, ctx);
  }

  return ctx.table(tableName);
}
