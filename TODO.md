# Migration Plan: `longcelot-sheet-db` + Admin/User Split

Status: Phase 1 (admin actor + role handling) and the admin stats API
implemented. Phase 2 (migrating existing per-user Sheets CRUD to lsdb) is
**done** — every table with real Sheets I/O now goes through lsdb:
`categories`, `transactions`, `budgets`, `budget_items`, `budget_incomes`,
`goals`, `telegram_messages`. `settings` was skipped — its controllers
(`getSettings`/`updateSettings`/`resetSettings`) turned out to be pure
placeholders that never touched Google Sheets at all, so there was nothing
to migrate. Full repo `tsc --noEmit` and `eslint` pass with zero new errors,
and the server boots and responds correctly on every migrated route
(verified with curl against each endpoint — 401s as expected with no auth
token, no server-side crashes). Phase 4 (frontend admin tab) is **done** —
role-gated nav entries, a `/admin` page showing total/active user stats,
client-side redirect for non-admins backed by server-side `requireAdmin`
enforcement. Phase 5 cleanup (deleting the superseded
`services/googleSheets/*` files) intentionally not done yet — see §5.
Owner: backend
Decided: single web app, role-gated admin tab (see "Architecture decision"
below). Sheet provisioning stayed on the existing per-user-OAuth code path
rather than switching to lsdb's `createUserSheet()` (§1.5) — but the net
result is the same as the `actorTokens` trade-off originally recorded here:
`SUPER_ADMIN_EMAIL` ends up with standing Drive access to every user's
spreadsheet (via an explicit share step now, not `createUserSheet`'s
internals). See §1 and §1.5 for the full detail — this is a knowing,
recorded trade-off, not an oversight.

## 0. What we're solving

Today (`apps/backend/src/services/googleSheets/`):
- Each user gets a personal Google Spreadsheet, found by **searching Drive by
  filename** (`Budget Manager - {email}`) — there is no central index/registry
  of users anywhere. Counting users today means listing Drive files.
- Data layer is hand-rolled (`crud.ts`, `sheets.ts`, `schema-migration.ts`,
  `schema-versions.ts`, `database.ts`, `validate.ts`) and duplicates schema
  definitions for OTP/Telegram tables (`otp_users`, `otp_requests`,
  `recovery_codes`, `link_tokens`, `telegram_credentials`) that **also**
  already exist as real Postgres tables via Knex
  (`apps/backend/migrations/001_init.cjs` etc.) — two sources of truth for
  the same entities.
- There is no `role` concept anywhere in the app. No admin exists.
- Auth is a hand-rolled Google OAuth callback + custom JWT
  (`middleware/auth.ts`, `controllers/auth/handleCallback.ts`).

Goal:
- Two actors: **admin** (sees aggregate stats: total users, active users,
  etc., and nothing else) and **user** (fully owns their own budget data;
  admin cannot read it).
- Adopt `longcelot-sheet-db` (lsdb) for the per-user Sheets data layer,
  replacing the hand-rolled equivalent.
- Single Next.js frontend app with a role-gated `/admin` section, not a
  separate app (see decision below).

## 1. What `longcelot-sheet-db` actually is (read from its README/API/skills)

- It is a **standalone storage adapter**, not a staging layer in front of
  Postgres. When configured for Sheets (`DB_DRIVER=sheets`), Google Sheets
  *is* the database — nothing else is written unless you also use its
  separate Postgres/MySQL/Prisma adapters, which is a different DB entirely,
  not a sync mirror.
- **Schema-first**: `defineTable({ name, actor, timestamps, softDelete, columns })`
  with a fluent column builder. One table = one sheet tab.
- **`actor`** controls *where* data is stored (which spreadsheet), not
  *what a user is allowed to do*. The docs are explicit: **lsdb intentionally
  ships no RBAC** — permissions/roles are the app's job.
- **Permissions matrix** governs cross-actor access between non-admin actors
  only. Critically: **`admin` always bypasses the permission matrix** — if
  admin code is ever given a `targetSheetId`, it can read that user's sheet.
  The library provides no way to make a user's data literally unreadable to
  an `admin`-actor context.
- **One Google Spreadsheet per user** (`createUserSheet(userId, role, email)`),
  which also inserts a row into a central admin-owned "users" registry table
  (with `actor_sheet_id`) — this is the piece our current code is missing.
- **`where` filtering is exact-match equality only** (`Record<string, unknown>`,
  confirmed against `TableOperations`/`FindOptions` in API.md) — no `gte`/`lte`/
  range operators. "Active users in the last N days" has to be computed in
  application code after `findMany()`, not pushed down into the query (see §3
  Phase 3 — this is what `adminStats.ts` actually does).
- **`createUserSheet(userId, role, email, options?)` with `actorTokens`
  creates the sheet in the *user's own* Google Drive — but automatically
  shares it with `SUPER_ADMIN_EMAIL` as an editor at creation time.** This is
  hardcoded library behavior (`skills/drive/SKILL.md` §3), not configurable.
  See "Accepted trade-off" below.
- Scaling limits called out directly in the docs: ~60 reads/min/user quota,
  in-memory filtering (`findMany` reads the whole sheet), "suitable for
  hundreds to low-thousands of rows... not suitable for millions," not
  recommended for high-performance/real-time workloads. Fine for personal
  budget data (transactions/categories per user), not something to lean on
  for cross-user aggregation.
- CLI (`lsdb`/`sheet-db`): `init`, `generate <table>`, `sync [--all-users]`,
  `validate`, `seed`, `mock-users`, `doctor`, `status`, `erdiagram`,
  `migrate --prisma|--sql`, `migrate-data`, `drop-table`, `drop-column`,
  `rename-column`.

### Key implication for "admin has no access to user data" — accepted trade-off

Two designs were considered and are worth recording, since the final choice
is a deliberate reversal of the original "admin has zero access" goal:

**Design considered and rejected**: skip `createUserSheet()` entirely, keep
provisioning user spreadsheets exactly the way the app already does today
(via that user's own OAuth tokens, in their own Drive, shared with no one —
confirmed by reading `services/googleSheets/database.ts` and
`controllers/auth/handleCallback.ts`), and use lsdb purely as a schema/CRUD
DSL on top of those existing sheets. This would have preserved true
zero-access for admin, at the cost of losing lsdb's built-in multi-user
tooling (`sync --all-users`, `migrate-data --all-users`, the built-in admin
registry).

**Design chosen**: use `adapter.createUserSheet(userId, 'user', email, { actorTokens })`
to get lsdb's full tooling. This means, explicitly and by the user's
decision: **`SUPER_ADMIN_EMAIL` is automatically granted editor access to
every user's spreadsheet the moment it's created** — the library does this
internally, unconditionally, with no way to opt out (see §1). The admin's
Google account can open any user's budget spreadsheet directly, outside of
our own application code entirely (no API route needed — it's a normal
Google Sheets share).

**What this means in practice:**
- "Admin has no access to user data" is **not actually true** for this
  build — it is now "admin has no access *through our application's admin
  API*, but does have standing Google Drive access to every user's
  spreadsheet via the share `createUserSheet` grants automatically."
- The `user_stats` table (§2) still deliberately carries no sheet-id column
  and admin API routes still never construct a context aimed at a user's
  sheet — that boundary is real for the *application surface*, just not for
  the admin's Google account itself.
- If this trade-off needs to be revisited later, the fix is switching off
  `actorTokens`/`createUserSheet()` per the rejected design above — it's a
  provisioning-path change, not a data-model change, so it doesn't require
  re-migrating existing data.

## 2. Architecture decision

**Single storage layer (lsdb), two lsdb actors, deliberately no link between them:**

| Actor | Storage | Contains | Who can query |
|---|---|---|---|
| `admin` | One dedicated admin spreadsheet, lsdb `actor: 'admin'` | Our own `user_stats` table: user id, email, role, created_at, last_login_at — no spreadsheet id/URL. Plus lsdb's own built-in `users`/`credentials`/`schema_versions` tables, which **do** carry `actor_sheet_id` (populated by `createUserSheet`). | Admin-only stats routes (query `user_stats` only — never the built-in `users` table, see §1 accepted trade-off) |
| `user` | One spreadsheet per user, lsdb `actor: 'user'`, created in the user's own Drive via `actorTokens` | categories, transactions, budgets, budget_items, goals, budget_incomes, settings, telegram_messages | The owning user's own request context, using an `actorSheetId` known from their own session — **and, per the accepted trade-off in §1, the admin's Google account directly (Drive share), outside of the app entirely** |

Admin never constructs an lsdb context with another user's `actorSheetId`,
and no such id is ever retrievable from the `admin`-actor table. Every write
to `user_stats` happens as a system-level operation during login processing
(using the backend's own lsdb credentials, not anything the logged-in user
or an admin API consumer controls) — it records *that a login happened*,
never anything from the user's own budget data.

**Frontend: single app, no split.** `apps/frontend` stays one Next.js app.
Add a role-gated `app/(protected)/admin/` section (or a tab within the
existing protected layout) that only renders/links for `role === 'admin'`,
backed by `requireAdmin`-protected API routes. Rationale: an admin here only
needs read-only aggregate stats, not a distinct product surface — a second
app would mean duplicating auth, layout, and API client plumbing for
marginal benefit. Revisit only if the admin surface grows substantially
(e.g., support tooling, impersonation, moderation queues).

## 3. Phased plan

### Phase 1 — `admin` actor + role handling — ✅ implemented

Files actually added/changed:
- `apps/backend/src/services/sheetDb/schemas/admin/userStats.ts` — the
  `user_stats` schema (`user_id`, `email`, `role`, `last_login_at`,
  `timestamps: true`). Deliberately no `actor_sheet_id`/spreadsheet column.
- `apps/backend/src/services/sheetDb/adapter.ts` — `getAdapter()`, a
  memoized async factory that builds the `createSheetAdapter()` instance
  from `ADMIN_SHEET_ID`/`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI`
  plus admin OAuth tokens loaded from Redis, and registers `userStatsSchema`.
  Also `storeAdminTokens()`, used at admin login (see below).
- `apps/backend/src/services/redisClient.ts` — a minimal lazy Redis client
  (`REDIS_URL`, already provisioned in `docker-compose.yml`), used only to
  persist the admin account's own OAuth tokens under the key
  `lsdb:admin-tokens`. **Why this exists**: `createSheetAdapter()` needs a
  long-lived admin identity's tokens at construction time, and the app has
  no other secret store — the admin's tokens are captured automatically the
  first time `SUPER_ADMIN_EMAIL` (specifically — see below, not the broader
  `ADMIN_EMAILS` list) logs in through the existing OAuth callback.
  Bootstrap note: admin-dependent features (the stats endpoint, and any
  per-user Sheets CRUD — see Phase 2) return a clear error until the admin
  has logged in at least once after deploy.
- `apps/backend/src/utils/adminRole.ts` — `isAdminEmail()`. Role is **not
  stored anywhere**; it's computed at login time against `ADMIN_EMAILS`
  (comma-separated) or the pre-existing `SUPER_ADMIN_EMAIL` env var — this
  is the app-level "can this account see `/api/v1/admin/*`" allowlist. It is
  a **separate concept** from the one Google identity backing the lsdb
  adapter (below): `ADMIN_EMAILS` can list several people who are allowed
  into the admin UI; the adapter's own Google credentials are always
  specifically `SUPER_ADMIN_EMAIL`, singular — if `storeAdminTokens()` fired
  for every `ADMIN_EMAILS` entry, whichever admin happened to log in last
  would silently swap out the adapter's underlying Google identity (and
  therefore which Drive account has editor access to every user's sheet —
  see Phase 2). `handleCallback.ts` checks `email === process.env.SUPER_ADMIN_EMAIL`
  exactly, not `isAdminEmail()`, when deciding whether to call
  `storeAdminTokens()`. No "become admin" API, no self-serve promotion.
- `apps/backend/src/services/sheetDb/adminStats.ts` — `recordLogin()`
  (upserts the caller's row in `user_stats`, fire-and-forget, errors logged
  and swallowed so a Sheets hiccup never blocks login) and `getUserStats()`
  (returns `{ totalUsers, activeUsers, activeWindowDays }`; active-user
  filtering happens in application code after `findMany()` since lsdb's
  `where` has no range operators — see §1).
- `apps/backend/src/middleware/auth.ts` — `AuthenticatedRequest.user.role`
  added; new `requireAdmin` middleware (401 if unauthenticated, 403 if
  `role !== 'admin'`).
- `apps/backend/src/controllers/auth/handleCallback.ts` — computes `role`
  via `isAdminEmail()`, calls `storeAdminTokens()` when the admin logs in,
  calls `recordLogin()` for every login, includes `role` in the JWT payload.

Not yet done: the admin spreadsheet's schema (`user_stats` tab) hasn't been
synced/created against a real `ADMIN_SHEET_ID` — that requires an actual
Google Sheet + OAuth app credentials, which don't exist in this environment.
It'll auto-create on first real use since `onSchemaMismatch: 'auto-sync'`
(see Phase 2 below for why that's the chosen mode over `'warn'`).

### Phase 1.5 — sheet provisioning: `createUserSheet` **not** adopted — plan revised during Phase 2

The original plan (previous revision of this doc) was to switch sheet
creation to `adapter.createUserSheet(userId, 'user', email, { actorTokens })`,
accepting that it grants `SUPER_ADMIN_EMAIL` standing editor access to every
user's sheet as a side effect. While actually wiring up the first table
(`categories`, Phase 2), a simpler option turned out to be available and was
used instead — recorded here since it changes several details of the
original plan text in §1/§2 above (left as historical context, not rewritten):

**What shipped**: sheet creation is untouched — still
`getOrCreateUserDatabase()`/`createNewUserDatabase()` in
`services/googleSheets/database.ts`, using that user's own OAuth tokens, same
as before this migration started. What's new is
`services/sheetDb/ensureAdminSheetAccess.ts`, called once per login
(`handleCallback.ts`) for every non-admin user: it lists the spreadsheet's
current Drive permissions and, only if `SUPER_ADMIN_EMAIL` isn't already
listed, grants it editor access — using that same user's own OAuth
credentials already in hand from the callback, no new consent flow. This
runs for **existing** users' sheets (created long before this migration)
just as well as new ones, with no separate backfill script needed — it
self-heals on next login.

**Net effect on the isolation question is unchanged from the previous
revision of this doc**: `SUPER_ADMIN_EMAIL` ends up with standing Drive
access to every user's spreadsheet either way. What's different is *how* —
no dependency on lsdb's `createUserSheet` internals, sheet creation stays on
the existing well-tested code path, and there's no reliance on lsdb's
built-in admin `users`/`actor_sheet_id` registry table. lsdb's adapter is
used **only** for the schema-defined CRUD layer (`withContext().table()`),
not for provisioning.

### Phase 2 — Adopt lsdb for the per-user Sheets data layer — ✅ done

Files: `apps/backend/src/services/sheetDb/schemas/user/*.ts` (new schemas),
`apps/backend/src/services/sheetDb/userContext.ts` (new helper), and every
controller listed below. `services/googleSheets/*` itself is untouched —
still present, no longer called by any migrated controller (see §5 for what
cleanup remains).

1. Tables defined with `defineTable()`, matching `BASE_SCHEMA` column names
   exactly (existing sheets needed no data migration) — **except** the
   OTP/Telegram tables that already also exist as Postgres migrations
   (`otp_users`, `otp_requests`, `recovery_codes`, `link_tokens`,
   `telegram_credentials`) — that duplication predates this plan, separate
   pre-existing feature, left as-is:
   - `categories` ✅ (`schemas/user/categories.ts`)
   - `transactions` ✅ (`schemas/user/transactions.ts`) — `category_id` has
     `ref('categories.id')`
   - `budgets` ✅ (`schemas/user/budgets.ts`)
   - `budget_items` ✅ (`schemas/user/budgetItems.ts`) — `budget_id` has
     `ref('budgets.id')`; `category_id` deliberately has **no** `ref()`,
     matching the old controller's explicit choice to skip category
     validation there to save API calls
   - `budget_incomes` ✅ (`schemas/user/budgetIncomes.ts`)
   - `goals` ✅ (`schemas/user/goals.ts`) — includes `last_notified_at`
     (in `BASE_SCHEMA` but not yet written by any live code path)
   - `telegram_messages` ✅ (`schemas/user/telegramMessages.ts`) — added
     `telegram_message_id` as a new optional column: `sendMessage.ts` was
     already writing this field even though `BASE_SCHEMA` never declared
     it; `onSchemaMismatch: 'auto-sync'` (below) adds it to existing sheets
     rather than continuing to silently drop it
   - `settings` — **skipped**. `getSettings`/`updateSettings`/`resetSettings`
     turned out to be pure placeholders (`// Implementation placeholder`)
     that never call into Google Sheets at all — nothing to migrate. No
     `schemas/user/settings.ts` was created; add one if/when this feature is
     actually built.

   `timestamps`/`softDelete` deliberately left off every schema —
   created_at/updated_at stay app-managed plain string columns, same field
   names the frontend already expects, rather than switching to lsdb's own
   underscore-prefixed auto timestamp columns.
2. ~~Replace `getOrCreateUserDatabase`~~ — superseded by Phase 1.5 above;
   sheet creation is unchanged.
2b. `adapter.ts`'s `onSchemaMismatch` is `'auto-sync'`, not `'warn'` as
   originally planned — mirrors the old hand-rolled `ensure*Schema()` calls
   that ran defensively before every request (auto-creates missing
   tabs/columns instead of only logging). This is also what backfills
   `telegram_messages.telegram_message_id` onto existing users' sheets.
3. Every hand-rolled `crud.ts` call (`insert`/`find`/`findById`/`update`/`delete`)
   replaced with `services/sheetDb/userContext.ts`'s
   `getUserTable(email, spreadsheetId, tableName)` (wraps
   `adapter.withContext({ userId: email, actor: 'user', actorSheetId }).table(name)`)
   across all 26 controllers in `categories`, `transactions`, `budgets`
   (incl. the `budget_items`/`budget_incomes` sub-resources), `goals`, and
   `telegram/sendMessage.ts`. Mapping used throughout:
   - `find(spreadsheetId, table, filters)` → `table.findMany({ where: filters })`
     — any `user_id`/email filter dropped, redundant once `actorSheetId`
     already scopes the whole table to one user
   - `findById(spreadsheetId, table, id)` → `table.findOne({ where: { id } })`
   - `insert(spreadsheetId, table, data)` → `table.create(data)`
   - `update(spreadsheetId, table, id, data)` → `table.update({ where: { id }, data })`
   - `delete(spreadsheetId, table, id)` → `table.delete({ where: { id } })`
   - Every `ensure*Schema()`/`ensureTableExists()` call deleted —
     `onSchemaMismatch: 'auto-sync'` (2b) handles it
   - lsdb column values are optional-or-absent, not optional-or-`null` —
     `telegram/sendMessage.ts` had to change `field: value || null` to
     `field: value ?? undefined` for `error`/`sent_at`/`telegram_message_id`
     to avoid failing schema validation on every pending/failed send
   - `controllers/categories/migrateEmojis.ts` intentionally left
     untouched — a one-off admin-triggerable backfill utility
     (`utils/categoryMigration.ts`) operating directly on the raw Sheets
     API, orthogonal to the CRUD path migrated here
   - Bug fixed in passing: `updateBudgetItem.ts`'s duplicate-category check
     filtered on `user_id`, a column `budget_items` has never had — every
     row's `user_id` was `undefined`, so the filter silently never matched
     anything and the "duplicate budget item" check was permanently a
     no-op. Dropped the bogus filter key; the check now actually runs.
4. **Not yet done**: replace hand-rolled `schema-migration.ts`/`schema-versions.ts`
   bookkeeping with lsdb's own (`onSchemaMismatch`, `lsdb sync`), and delete
   the superseded files: `services/googleSheets/{crud,sheets,schema-migration,
   schema-versions,database}.ts` and each migrated table's
   `googleSheets/endpoints/<table>/*Service.ts`. Deferred to Phase 5 (§5) —
   left in place for now since nothing currently imports them from the
   migrated controllers, but other still-untouched code (`controllers/sheets/*`,
   `controllers/auth/*`'s sheet creation, the OTP adapter) still depends on
   `services/googleSheets/{client,database,crud,sheets}.ts` directly, so nothing
   is safe to delete outright yet — see §5's updated checklist.

### Phase 3 — Admin stats API — ✅ implemented

Files: `apps/backend/src/controllers/admin/getStats.ts`,
`apps/backend/src/routes/admin.ts` (mounted at `/api/v1/admin` in `src/index.ts`).

1. `GET /api/v1/admin/stats?activeWindowDays=30` (param optional, clamped to
   1–365), protected by `authenticateToken` + `requireAdmin`. Verified: an
   unauthenticated request returns `401 {"success":false,"message":"Access
   token required"}`.
2. `getStats` calls `adminStats.getUserStats()`, which queries only
   `user_stats` (`findMany({ where: { role: 'user' } })`) and computes the
   active-user count in application code — confirmed lsdb's `where` is
   exact-match only (`TableOperations`/`FindOptions` in API.md have no range
   operators), so this couldn't be pushed into the query anyway.
3. Enforced by code review (no automated check exists): **no handler under
   `/api/v1/admin/*` constructs an lsdb context aimed at a user's sheet, and
   none reads the built-in `users` table that now carries `actor_sheet_id`**
   (see §1). This is the application-level half of the isolation story — the
   admin's standing Drive access from `createUserSheet` (§1) is separate and
   outside the app's control either way.
4. No per-user data endpoints under `/api/v1/admin/*` — if a future admin
   need requires looking at one user's budget data (e.g. support), treat
   that as a deliberate, separately-authorized feature with its own
   consent/audit trail, not a default capability.

### Phase 4 — Frontend: role-gated admin tab — ✅ done

Files:
- `apps/backend/src/controllers/auth/getProfile.ts` — added `role: user.role`
  to the `/api/v1/auth/profile` response (the JWT already carried `role`
  from Phase 1; this endpoint just wasn't returning it to the frontend yet).
- `apps/frontend/lib/auth-service.ts` — `User.role?: 'admin' | 'user'`, and
  `getCurrentUser()` now maps `userData.role` onto it.
- `apps/frontend/lib/api-config.ts` — added `ADMIN.STATS` endpoint.
- `apps/frontend/lib/admin-service.ts` — new, mirrors the existing
  `categories-service.ts`/`budgets-service.ts` pattern (static class,
  `httpClient`, a service-specific error subclass). `AdminService.getStats(activeWindowDays?)`.
- `apps/frontend/app/(protected)/admin/page.tsx` — new page. Reuses the
  existing `DashboardStatCard` component for the two stat tiles (total
  users, active users in the trailing window). Redirects non-admins to
  `/dashboard` client-side — UX only, the real enforcement is
  `requireAdmin` on the backend route (Phase 3).
- `apps/frontend/components/layout/Sidebar.tsx` — appends an "Admin" nav
  item only when `user?.role === 'admin'`.
- `apps/frontend/components/layout/Topbar.tsx` — same, as a profile
  dropdown item (mobile top bar). The mobile bottom nav (`Appbar.tsx`) was
  deliberately left untouched — its 5 slots are already tight for the
  primary user flows, and the Topbar dropdown already covers mobile.
- No changes to regular user-facing pages — an admin who's also a regular
  user keeps full access to their own budget data through the existing UI.

Verified: `npx tsc --noEmit` clean, `npx next build` succeeds and lists
`/admin` as a registered static route, `npx next dev` serves `/admin` (200,
renders the client-side loading state — full auth flow untestable here
without real Google OAuth credentials).

### Phase 5 — Cleanup — not started

1. `longcelot-sheet-db` is now genuinely imported and load-bearing (Phase 1
   + Phase 2) — the "installed but unused" state from the start of this plan
   no longer applies. `otp-telegram-longcelot` is unrelated to this work;
   not verified here.
2. **Safe to delete now**: none of `services/googleSheets/{crud,sheets,schema-migration,
   schema-versions}.ts` are imported by any table controller anymore
   (`categories`, `transactions`, `budgets`/`budget_items`/`budget_incomes`,
   `goals`, `telegram/sendMessage.ts` all moved to `sheetDb/userContext.ts`).
   Each migrated table's `googleSheets/endpoints/<table>/*Service.ts`
   wrapper is similarly now dead code.
3. **Not safe to delete yet** — still directly imported elsewhere:
   `services/googleSheets/client.ts` (OAuth client singleton — used by
   `handleCallback.ts`, `ensureAdminSheetAccess.ts` indirectly via its own
   `OAuth2Client`, and most of `controllers/auth/*`/`controllers/sheets/*`),
   `services/googleSheets/database.ts` (`getOrCreateUserDatabase`, still the
   live sheet-provisioning path per §1.5), and anything under
   `controllers/sheets/*` (schema validation/setup endpoints, untouched by
   this migration). A real dependency audit (`grep -rl` per file) is needed
   before deleting anything in step 2 — do it file by file, not as a batch.
4. Update `.env.example` / deployment docs for any new env vars — **done**:
   `ADMIN_SHEET_ID`, `SUPER_ADMIN_EMAIL`, `ADMIN_EMAILS` (optional), and
   `REDIS_URL` were added to `apps/backend/.env.example` in Phase 1. No
   Postgres provisioning needed — Postgres stays scoped to the pre-existing,
   unrelated OTP/Telegram feature.

## 4. Open questions / follow-ups

- **Revisit the `createUserSheet`/`actorTokens` trade-off?** Right now admin
  has standing Drive access to every user's spreadsheet (§1). If that turns
  out to matter more than the tooling convenience it buys, the fix is
  dropping `actorTokens` from the Phase 2 `createUserSheet` call and going
  back to hand-rolled sheet creation (the design considered-and-rejected in
  §1) — it's a provisioning-path change, not a data-model change.
- Should the `user_stats` table store the raw email, or a hash? Flagging
  since it's the one piece of PII admin's own API surface has direct access
  to (separate from the Drive-share issue above).
- Definition of "active user" — implemented as a 30-day trailing login
  window, overridable per-request via `?activeWindowDays=`. Confirm the
  default is what's actually wanted.
- Whether to also adopt lsdb's `createAuthRouter`/JWT for the OAuth flow
  itself, or keep the existing hand-rolled OAuth + JWT (`middleware/auth.ts`)
  as-is and only adopt lsdb for the data layer. **Decision so far: kept
  existing auth** — Phase 1 only added role computation and lsdb-adapter
  bootstrapping on top of the existing `handleCallback.ts` flow, it didn't
  replace it.

## 5. Non-goals

- Not building per-tenant/organization sharing between users — each user's
  data stays single-owner.
- Not giving admin any *application-level* read path into individual user
  budget data (no route, no lookup) — but see §1: admin's Google account
  does have standing Drive access via `createUserSheet`, which is a
  different thing and a deliberate trade-off, not an oversight.
- Not splitting the frontend into two apps (see §2).
- Not provisioning Postgres for this feature — not needed with this design.
