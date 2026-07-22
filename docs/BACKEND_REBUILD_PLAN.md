# Backend Rebuild Plan — `apps/backend` v2

**Status: PLANNING — nothing in this doc has been implemented yet.** This is
the design to review before any code is written. `apps/backend` was renamed
to `apps/backend-v1` and kept as a working reference/rollback copy; a new
backend will be built from scratch at `apps/backend`.

## 1. Context

`backend-v1` grew organically: a hand-rolled Google Sheets CRUD layer
(`services/googleSheets/*`) was later partially migrated to
`longcelot-sheet-db` (lsdb) table-by-table (see `TODO.md`, now historical),
leaving two storage layers side by side, plus a since-removed
Telegram-OTP auth path that briefly added a third (dead) Postgres schema.
The result works but isn't a design anyone would choose starting fresh.

This rebuild starts clean: **lsdb is the only storage layer, from the first
line of code**, and the auth design is decided up front instead of bolted on
in phases.

## 2. Goals

1. **Auth**: Google OAuth *and* email+password, both resolving to the same
   per-user account/spreadsheet.
2. **API surface**: match what `apps/frontend` already calls — no frontend
   changes required to adopt the new backend (see §7 for the exact audited
   contract, including a few frontend inconsistencies flagged separately).
3. **Storage**: Express + lsdb, tables designed clean from scratch (no
   legacy column baggage carried over just for compatibility with old
   sheets — there are no production users/sheets to preserve).
4. **Admin**: read-only aggregate stats and dashboard (total/active users)
   only. Admin's UI and API surface never lists, opens, or edits another
   user's budget data.

## 3. Non-goals / guardrails

- No per-tenant/organization sharing between users — single-owner data,
  same as before.
- No admin application-level read path into a specific user's budget data
  — no route, no lookup, no "view as user." (See §4.7 for the one caveat
  that's outside the app's control.)
- No reintroduction of Telegram-OTP login. Telegram *notifications*
  (connect account, send alerts) stay, unrelated to auth.
- No Postgres, no Knex, no second database of any kind.
- Not splitting the frontend into an admin app + user app (unchanged
  reasoning from `TODO.md` §2: admin only needs a read-only tab).

## 4. Architecture decisions

Each subsection is a recommendation with rationale. Items marked
**⚠ NEEDS YOUR SIGN-OFF** are genuine judgment calls, not just implementation
detail — please confirm or redirect before I start building.

### 4.1 Repo layout & workspace housekeeping

- New backend lives at `apps/backend` (matches every existing path
  reference: `render.yaml`'s `startCommand`, the CI matrix
  (`.github/workflows/ci-cd.yml`), `docs/CONTROLLER_ARCHITECTURE.md`). No
  infra config needs to change once the new backend lands in that path.
- `apps/backend-v1` stays as a filesystem reference but should be **removed
  from the pnpm workspace** (`pnpm-workspace.yaml`) so it's not built,
  linted, or type-checked by `turbo run *` anymore, and so its
  `package.json` name (`@budget-managing/backend`) doesn't collide with the
  new one. Concretely: add `"!apps/backend-v1"` to the `packages:` list.
- **⚠ NEEDS YOUR SIGN-OFF**: how long does `backend-v1` stick around —
  delete it once the rebuild is verified working, or keep it indefinitely
  as an archive? I'd default to deleting it after a verified cutover, but
  it's your call.

### 4.2 Storage: lsdb only

No `services/googleSheets/*` hand-rolled layer, no
`schema-migration.ts`/`schema-versions.ts` bookkeeping — lsdb's own
`onSchemaMismatch: 'auto-sync'` and `lsdb sync` replace that entirely from
day one. Every table, including the account registry, is an lsdb
`defineTable()` schema.

### 4.3 Sheet provisioning: adopt `createUserSheet()` (reversing the old trade-off)

`backend-v1` deliberately avoided lsdb's own `createUserSheet()` and kept
hand-rolled Drive-search-by-filename provisioning, to avoid lsdb's
built-in registry going unused (see `TODO.md` §1.5). Starting fresh, that
tradeoff flips:

- `adapter.createUserSheet(userId, 'user', email, { actorTokens })` creates
  the sheet in **the user's own Drive** (using their OAuth tokens captured
  at signup) and writes a row into our own `admin.users` schema
  (`user_id`, `role`, `email`, `actor_sheet_id`, plus our extra columns —
  see §5).
- This is strictly less custom code than hand-rolling Drive search, gives
  us `lsdb sync --all-users` / `lsdb status` / `lsdb doctor` for free, and
  is the officially documented pattern (`skills/auth-router/SKILL.md`,
  `skills/drive/SKILL.md`).
- **Known trade-off, inherited from lsdb itself, not from our old code**:
  `createUserSheet` unconditionally shares the new sheet with
  `SUPER_ADMIN_EMAIL` as an editor. This means the admin Google account has
  standing Drive access to every user's spreadsheet, same as `backend-v1`
  ended up with via a different mechanism (`ensureAdminSheetAccess.ts`).
  It is not avoidable while using lsdb's registration flow, and is the same
  situation `backend-v1` already accepted — see §4.7 for how this
  interacts with "admin doesn't manage user data."
- Google-signup users: pass `actorTokens` from the OAuth callback tokens.
  Email/password-signup users have no Google tokens at registration time —
  their sheet is created via the admin's own credentials (lsdb's fallback
  path when `actorTokens` is absent), landing in the **admin's** Drive
  instead of their own until/unless they later link Google. This asymmetry
  is inherent to supporting both auth methods and is called out again in
  §6.

### 4.4 Auth: Google OAuth + email/password, one shared registry

**⚠ NEEDS YOUR SIGN-OFF on the core model below** — this is the biggest
design decision in this doc.

One `admin.users` table is the single account registry for both auth
methods, keyed by `email`:

| Column | Set by |
|---|---|
| `user_id` | Either method, at first registration |
| `email` | Either method |
| `role` | Computed from `ADMIN_EMAILS` allowlist at login, same as `backend-v1` (`utils/adminRole.ts`) |
| `actor_sheet_id` | Set by `createUserSheet` at first registration |
| `password_hash` | Set only if the user registered/set a password (nullable) |
| `google_sub` | Set only if the user has signed in with Google at least once (nullable) |
| `name` | Either method |
| `created_at` / `last_login_at` | System-managed |

**Account linking rule**: identity is the **email address**, not the
method. If someone registers with email+password and later clicks
"Continue with Google" using the same email, it's the same account (same
`actor_sheet_id`) — we just backfill `google_sub` onto the existing row
rather than creating a second one. Same in reverse: a Google-only user who
later sets a password via a "add a password" settings option gets
`password_hash` backfilled onto their existing row. This matches the old
signup UX intent (`signup-card.tsx`'s pre-OTP-removal flow tried to do
something similar, informally) but makes it an explicit, enforced rule
instead of best-effort glue code.

**Why one registry table instead of lsdb's separate `createAuthRouter`
convenience wrapper**: `createAuthRouter` (see
`skills/auth-router/SKILL.md`) is built for a single login method per
router. Running two auth methods against one identity requires our own
`onUser`-equivalent logic anyway (to do the email-based linking above), so
we get more control wiring both flows by hand against the shared
`admin.users` table, while still reusing lsdb's underlying primitives:
`createLoginOAuthManager` (Google) and `hashPassword`/`comparePassword`/
`validatePasswordStrength` (password) — see `skills/auth/SKILL.md`.

Password requirements: lsdb's `validatePasswordStrength()` (min length +
upper/lower/number, bcrypt 10 rounds via `hashPassword()`) — no need to
hand-roll this again.

### 4.5 JWT & refresh tokens

`backend-v1`'s `/api/v1/auth/refresh` was a stub that never actually issued
a new token (`controllers/auth/refreshToken.ts` just echoed
`{ success: true, message: '...' }` with no `token` field) even though
`apps/frontend/lib/http-client.ts` has a real 401-retry interceptor
expecting one. This gets a real implementation this time:

- Access JWT: short-lived (e.g. 1h), HS256, payload `{ email, name,
  spreadsheetId, role, iat }` — no `googleCredentials` embedded in the
  token this time (see below).
- Refresh JWT: long-lived (e.g. 30d), separate secret, minimal payload
  (`{ email, iat }`), used only to mint a new access token at
  `POST /api/v1/auth/refresh`.
- **Change from `backend-v1`**: the old JWT embedded the user's raw Google
  OAuth `credentials` object (access+refresh token) directly in the app
  JWT payload — every authenticated request round-tripped the user's
  Google refresh token to the browser and back. New design stores Google
  tokens server-side only (lsdb's own `tokenStore` — see
  `skills/drive/SKILL.md` — or a small Redis-backed store, reusing the
  pattern `backend-v1` already has for the admin's own tokens in
  `services/redisClient.ts`). The app JWT never carries Google credentials.
  **⚠ NEEDS YOUR SIGN-OFF**: this is a real security improvement but is a
  behavior change from `backend-v1` — flagging in case there's a reason
  the old design put credentials in the JWT that I'm not aware of (I
  couldn't find one in the code or `TODO.md`).

### 4.6 Table design conventions

- Every table gets lsdb's automatic `_id` (nanoid) as the real primary key
  — no more hand-maintained `id: string().required().unique()` duplicating
  what lsdb already generates (that was `backend-v1`'s compromise to avoid
  changing the API response shape; starting fresh, there's no shape to
  preserve).
- **API responses still expose `id`, not `_id`** — the controller/service
  layer maps `{ _id, ...rest } → { id: _id, ...rest }` on the way out.
  Frontend code (`Category.id`, `Transaction.id`, etc.) needs zero changes.
- `timestamps: true` on every table (lsdb's `_created_at`/`_updated_at`)
  instead of hand-maintained `created_at`/`updated_at` string columns —
  again mapped to the old field names (`created_at`/`updated_at`) in API
  responses for frontend compatibility.
- `softDelete: true` on user-facing entities where "undo" or audit history
  is plausible (transactions, budgets, goals) — **⚠ NEEDS YOUR SIGN-OFF**:
  soft-deleted rows stay in the sheet forever (no purge job in lsdb), which
  means sheets grow monotonically for users who delete/recreate data often.
  Given lsdb's "hundreds to low-thousands of rows" comfort zone, this seems
  fine for a personal budget app, but it's a real trade-off worth a
  deliberate yes/no rather than a default.
- FK references use `ref('table._id')` (lsdb's own PK), not the old
  `ref('categories.id')` pattern.

### 4.7 Admin boundary — what "doesn't manage user data" means precisely

- Admin's own actor sheet legitimately contains the **account registry**
  (`admin.users` — email, role, password hash, sheet id) because that's
  required for auth to work at all, plus a stats view for the dashboard.
  This is account/auth metadata, not budget data.
- No admin API route ever constructs an lsdb context with `targetSheetId`
  pointed at a user's spreadsheet, and no admin API response ever includes
  `password_hash`, `actor_sheet_id`, or any other registry field beyond
  aggregate counts. This is the same enforced-by-code-review boundary
  `backend-v1` already had (`TODO.md` §3, Phase 3 point 3) — carried
  forward unchanged.
- **The one thing outside the app's control** (inherited from §4.3, not new
  to this rebuild): `SUPER_ADMIN_EMAIL`'s Google account has standing Drive
  editor access to every user's spreadsheet, because `createUserSheet`
  does that unconditionally. This is a Google Drive permission, not
  something our API/UI exposes — same caveat `backend-v1` already
  documented and accepted.

## 5. Data model / schema catalog

All `user`-actor tables below live one per user spreadsheet. `admin`-actor
tables live in the one central admin spreadsheet.

| Table | Actor | Columns (beyond `_id`/timestamps) | Notes |
|---|---|---|---|
| `users` | admin | `user_id`, `role` (`admin`\|`user`), `email` (unique), `password_hash?`, `google_sub?`, `name`, `actor_sheet_id`, `last_login_at?` | The account registry + auth lookup table. `timestamps: true` gives `_created_at`. |
| `categories` | user | `name`, `emoji`, `color` | Same shape as `backend-v1`, minus the hand-rolled `id`/`created_at`/`updated_at`. |
| `transactions` | user | `name`, `amount`, `category_id` (`ref('categories._id')`), `category_name`, `date`, `time?`, `notes?`, `receipt_url?` | No more `user_id` column — redundant, `actorSheetId` already scopes the whole table. |
| `budgets` | user | `year`, `month`, `income` | |
| `budget_items` | user | `budget_id` (`ref('budgets._id')`), `category_id`, `category_name`, `amount`, `spent` | `category_id` intentionally left without `ref()`, same documented reason as `backend-v1` (skip an extra API call; frontend already sends a valid id). |
| `budget_incomes` | user | `year`, `month`, `amount`, `source?` | |
| `goals` | user | `name`, `limit_amount`, `period` (`enum: daily/weekly/monthly/yearly`), `notify_telegram` (bool, default false), `last_notified_at?` | |
| `telegram_connections` | user | `chat_id`, `telegram_username`, `status` (`enum: connected/pending/disconnected`), `connected_at` | **New table** — replaces `backend-v1`'s in-memory `TelegramConnectionStore` (its own comment already flagged it as dev-only and meant to be replaced with real storage). |
| `telegram_messages` | user | `chat_id`, `payload` (json), `status` (`enum: pending/sent/failed`), `error?`, `telegram_message_id?`, `sent_at?` | |
| `settings` | user | `currency`, `language`, `dark_mode` (bool), `telegram_notifications` (bool), `onboarding_complete` (bool, default false) | **New** — `backend-v1` left this as a pure placeholder that never touched Sheets at all, even though the frontend settings page really does call `GET`/`PUT /api/v1/settings`. Implementing it for real this time. |
| `user_stats` | admin | *(dropped — folded into `admin.users`)* | `last_login_at` already lives on `users`; a separate stats table added nothing `users` doesn't already have. Aggregate stats are computed by querying `admin.users` directly. |

## 6. Auth flow specs

### Google OAuth (login or signup — same flow, same as before)

1. `GET /api/v1/auth/google` → redirect to Google consent screen
   (`createLoginOAuthManager`, scopes include `openid email profile` +
   Sheets/Drive).
2. `GET /api/v1/auth/callback?code=...` → exchange code, `verifyToken()`,
   require `email_verified === true`.
3. Look up `admin.users` by email.
   - **Found, `google_sub` empty** (originally registered via password) →
     backfill `google_sub` onto the existing row (account linking, §4.4).
     Their spreadsheet stays wherever it already was.
   - **Found, `google_sub` set** → normal login.
   - **Not found** → new account: `createUserSheet(userId, 'user', email,
     { actorTokens: tokens })`, sheet lands in the user's own Drive.
4. Issue access + refresh JWT (§4.5), redirect to
   `${FRONTEND_URL}/auth/callback?token=...` — **unchanged from
   `backend-v1`**, since `apps/frontend/app/(auth)/callback/page.tsx`
   already expects exactly this redirect shape and reads `?token=` from
   the URL. (Its `code`-only fallback branch, which POSTs to
   `AUTH.CALLBACK`, is dead code today — Google never redirects straight
   to the frontend — so it's not part of the contract either way.)

### Email + password — register

1. `POST /api/v1/auth/register` `{ email, password, name }` →
   `validatePasswordStrength()`, `hashPassword()`.
2. Look up `admin.users` by email.
   - **Found, `password_hash` empty** (originally Google-only) → backfill
     `password_hash` onto the existing row ("add a password" case).
   - **Found, `password_hash` set** → 409 conflict, account exists.
   - **Not found** → new account: `createUserSheet(userId, 'user', email)`
     with **no** `actorTokens` (none available yet) — sheet lands in the
     **admin's** Drive for now (§4.3's asymmetry). Store `password_hash`.
3. Issue access + refresh JWT, respond directly with the token pair (no
   redirect needed — this is a same-origin API call, not an OAuth hop).

### Email + password — login

1. `POST /api/v1/auth/login` `{ email, password }` → look up by email,
   `comparePassword()`. 401 on any mismatch (don't leak which part was
   wrong).
2. Issue access + refresh JWT, same response shape as register.

### Refresh

`POST /api/v1/auth/refresh` `{ refreshToken }` → verify the refresh JWT,
re-issue a new access JWT. Matches `apps/frontend/lib/http-client.ts`'s
existing interceptor contract exactly (`{ refreshToken }` in, `{ token }`
out) — this was previously broken (§4.5), now real.

## 7. REST API surface (audited against the live frontend)

Method marked **(dead)** means `api-config.ts` defines the endpoint but no
frontend code path actually calls it today — building it is optional/
lower-priority, not required for frontend parity. Everything else is a
confirmed live call site (grep-audited across `apps/frontend`, not assumed
from `api-config.ts` alone).

| Endpoint | Frontend call site |
|---|---|
| `GET /api/v1/auth/google` | `auth-service.ts` |
| `GET /api/v1/auth/callback` | Browser redirect target (not fetched by JS) |
| `POST /api/v1/auth/callback` | **(dead)** — `auth-service.ts`'s fallback path, never reached |
| `GET /api/v1/auth/profile` | `auth-service.ts`, `settings/page.tsx` (direct fetch) |
| `POST /api/v1/auth/logout` | `auth-service.ts` |
| `POST /api/v1/auth/refresh` | `http-client.ts` interceptor |
| `POST /api/v1/auth/register` | **New** (§6) |
| `POST /api/v1/auth/login` | **New** (§6) |
| `GET/POST /api/v1/categories`, `PUT/DELETE /api/v1/categories/:id` | `categories-service.ts` |
| `POST /api/v1/categories/migrate-emojis` | `categories-service.ts` — **legacy one-off backfill utility; skip unless you want it carried forward** |
| `GET/POST /api/v1/budgets`, `PUT/DELETE /api/v1/budgets/:id` | `budgets-service.ts` |
| `GET/POST /api/v1/budgets/items`, `PUT/DELETE /api/v1/budgets/items/:id` | `budgets-service.ts` |
| `GET/POST /api/v1/budgets/incomes`, `PUT/DELETE /api/v1/budgets/incomes/:id`, `GET /api/v1/budgets/incomes/sum` | `budgets-service.ts` |
| `GET/POST /api/v1/transactions`, `PUT/DELETE /api/v1/transactions/:id`, `GET /api/v1/transactions/summary` | Defined in `api-config.ts`; **no live frontend call site found** — `TransactionTable.tsx` is presentational, takes data via props. Build the API (parity with `backend-v1`'s controllers) since it's clearly intended, but note the frontend page itself isn't wired to fetch yet — that's a frontend follow-up, not blocked on this backend. |
| `GET/POST /api/v1/goals`, `PUT/DELETE /api/v1/goals/:id` | Same situation as transactions — `EditGoalDialog.tsx` is presentational, no live fetch found. Build for parity; frontend wiring is a separate follow-up. |
| `GET/PUT /api/v1/settings` | `settings/page.tsx` (direct fetch) — **live**, and this time backed by a real table (§5), not a placeholder |
| `GET /api/v1/telegram/status` | `TelegramConnectionCard.tsx`, `SendToTelegramButton.tsx` |
| `POST /api/v1/telegram/disconnect` | `TelegramConnectionCard.tsx` |
| `POST /api/v1/telegram/send` | `SendToTelegramButton.tsx` |
| `POST /api/v1/telegram/webhook` | Telegram's servers, not the frontend |
| `POST /api/v1/telegram/connect`, `configure`, `setup-notifications`, debug/test routes | `backend-v1` had these; no live frontend call site found for most (`connect` is used by the Telegram bot's deep-link flow server-side, not by frontend JS). Carry forward the ones the bot integration needs; drop the `debug-*`/`test-*`/`fix-connection` routes — those were manual-testing scaffolding, not product surface (see `docs/TELEGRAM_INTEGRATION_SETUP.md` for what the bot side actually needs). |
| `GET /api/v1/sheets/connect`, `/sync`, `/disconnect` | Defined in `api-config.ts`; **no live frontend call site found**. Confirm before building — may be entirely vestigial. |
| `GET /api/v1/admin/stats?activeWindowDays=` | `admin-service.ts` |

**Frontend issues found during this audit, not backend problems** (flagging
for awareness, not fixing here — out of scope for a backend rebuild plan):
- `settings/page.tsx` reads the JWT from `localStorage.getItem('token')`,
  but `auth-service.ts`/`http-client.ts` store it under `'auth_token'`.
  Today, every `fetch()` call in `settings/page.tsx` sends
  `Authorization: Bearer null`. This predates this plan and isn't
  something a backend rewrite can fix.
- `settings/page.tsx`'s onboarding modal collects a username/password and
  PUTs it into `/api/v1/settings` (`onboarding_password` field) — a
  leftover from the removed OTP registration flow. With real
  `/api/v1/auth/register` now existing (§6), this onboarding-modal-as-signup
  pattern is redundant and probably worth removing on the frontend side —
  flagging, not doing it here.

## 8. Proposed `apps/backend` structure

Keeps the modular controller pattern from `docs/CONTROLLER_ARCHITECTURE.md`
(update that doc once implemented — it's still accurate practice, just
needs its "Current Implementation" status table replaced).

```
apps/backend/
├── lsdb.config.ts
├── schemas -> src/services/sheetDb/schemas   (symlink, same reason as backend-v1: lsdb CLI vs tsconfig rootDir)
├── src/
│   ├── index.ts
│   ├── middleware/        (auth.ts, errorHandler.ts, security.ts, notFoundHandler.ts)
│   ├── routes/            (auth.ts, categories.ts, transactions.ts, budgets.ts, goals.ts, settings.ts, telegram.ts, admin.ts)
│   ├── controllers/
│   │   ├── auth/          (googleAuth.ts, googleCallback.ts, register.ts, login.ts, refresh.ts, getProfile.ts, logout.ts)
│   │   ├── categories/ transactions/ budgets/ goals/ settings/ telegram/ admin/   (one file per endpoint, per existing convention)
│   ├── services/
│   │   ├── sheetDb/
│   │   │   ├── adapter.ts       (createSheetAdapter + all registerSchema calls)
│   │   │   ├── userContext.ts   (getUserTable helper, unchanged pattern from backend-v1)
│   │   │   ├── adminStats.ts    (aggregate queries over admin.users)
│   │   │   └── schemas/{admin,user}/*.ts
│   │   ├── auth/
│   │   │   ├── googleOAuth.ts   (createLoginOAuthManager wrapper)
│   │   │   ├── password.ts      (thin re-export of lsdb's hashPassword/comparePassword/validatePasswordStrength)
│   │   │   ├── jwt.ts           (sign/verify access + refresh tokens)
│   │   │   └── tokenStore.ts    (Redis-backed, Google OAuth tokens server-side only — §4.5)
│   │   └── redisClient.ts       (carried forward from backend-v1, same purpose)
│   └── utils/              (logger.ts, adminRole.ts)
```

No `services/googleSheets/*` directory at all this time — there's nothing
to migrate away from since nothing legacy exists yet.

## 9. Phased implementation plan (not started)

1. Workspace housekeeping — exclude `backend-v1` from `pnpm-workspace.yaml`
   (§4.1), scaffold empty `apps/backend`.
2. `lsdb.config.ts`, `admin.users` schema, adapter bootstrap, Redis token
   store.
3. Auth: Google OAuth flow, email/password register+login, JWT
   issue/verify/refresh, account-linking rule (§6).
4. `requireAdmin`/`authenticateToken` middleware (same shape as
   `backend-v1`).
5. Budget domain tables + CRUD controllers: categories → transactions →
   budgets/budget_items/budget_incomes → goals → settings.
6. Telegram: `telegram_connections` + `telegram_messages` tables,
   connect/disconnect/status/send controllers, webhook handler.
7. Admin stats endpoint.
8. Wire `apps/frontend`'s `NEXT_PUBLIC_API_URL` at the new backend locally,
   smoke-test every live call site from §7 end to end.
9. Update `render.yaml`/CI/docs once verified; decide `backend-v1`'s fate
   (§4.1).

## 10. Open decisions needing your sign-off before I start coding

1. §4.1 — delete `backend-v1` after cutover, or keep indefinitely?
2. §4.4 — the shared-registry, email-as-identity account-linking model.
3. §4.5 — moving Google credentials out of the app JWT into server-side
   token storage (behavior change from `backend-v1`).
4. §4.6 — `softDelete: true` on transactions/budgets/goals (unbounded sheet
   growth vs. undo/audit capability).
5. §7 — which of the "no live call site found" endpoints (transactions,
   goals, `sheets/*`, several telegram debug routes) to build now for
   parity vs. skip until the frontend actually wires them up.

## 11. Docs updated alongside this plan

- `TODO.md` — marked historical/superseded, pointing here.
- `CLAUDE.md` — updated to describe the `backend-v1`/rebuild-in-progress
  state.
- `docs/PROJECT_OVERVIEW.md` — added a status note (its architecture
  section was already flagged stale before this plan).
