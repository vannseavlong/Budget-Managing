# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status: backend is being rebuilt — read this first

`apps/backend` **does not currently exist**. The old backend was renamed to
`apps/backend-v1` and kept only as a working reference/rollback copy; a
fresh backend is being planned/built at `apps/backend` from scratch, using
`longcelot-sheet-db` (lsdb) as the only storage layer from day one instead
of the incremental migration `backend-v1` went through.

**Read `docs/BACKEND_REBUILD_PLAN.md` before doing any backend work** — it
has the target architecture, the full audited API contract the frontend
needs, and a list of open decisions still pending sign-off. Everything below
this section describes `backend-v1` as it exists today (still accurate for
that codebase, useful as reference while rebuilding) — update this file
once the new backend lands in `apps/backend`.

## What this is

A budget-management monorepo where each user's financial data lives in **their own Google
Sheet** (not a shared database). Backend is Express/TypeScript, frontend is Next.js App
Router, and the storage layer is `longcelot-sheet-db` ("lsdb"), a schema-first ORM-like
adapter over the Google Sheets API. Authentication is Google OAuth 2.0 only in
`backend-v1` — there was previously an alternate email/password + Telegram-OTP login path,
but it was removed (see "OTP login — removed" below). The rebuild plan
(`docs/BACKEND_REBUILD_PLAN.md`) reintroduces email/password as a first-class second auth
method, not a revival of the OTP flow. Turbo + pnpm workspaces tie the apps and shared
packages together.

## Commands

Run from the repo root unless noted. Uses **pnpm** (see `packageManager` in `package.json`);
don't use npm/yarn.

```bash
pnpm install                                 # install everything
pnpm run dev                                 # turbo: run every workspace app in dev mode
pnpm --filter ./apps/backend-v1 run dev      # old backend reference (tsx watch, port 3001)
pnpm --filter ./apps/frontend run dev        # frontend only (next dev, port 3000)

pnpm run build                               # turbo: build all
pnpm run lint                                # turbo: lint all
pnpm run type-check                          # turbo: tsc --noEmit all
pnpm run format / format:check               # prettier across the repo

pnpm --filter ./apps/backend-v1 run test              # jest --passWithNoTests (no tests exist yet)
pnpm --filter ./apps/frontend run test                # jest (jsdom) — components/hooks/lib have real tests
pnpm --filter ./apps/frontend run test -- -t "name"    # run a single test by name
```

Notes:
- Frontend's `lint` script is currently a no-op stub (`"Linting temporarily disabled..."`) —
  don't rely on it to catch issues; use `type-check` instead.
- `apps/backend-v1` has no `jest.config`/tests directory; `--passWithNoTests` is intentional.
- `pnpm run security:audit` runs `pnpm audit` + turbo's `security:check` tasks; requires a
  Snyk token to be meaningful.
- Root-level `pnpm run dev`/`build`/etc. currently only really do anything useful for
  `apps/frontend` and (if referenced directly) `apps/backend-v1` — there's no `apps/backend`
  for turbo to pick up yet.

### lsdb CLI (Google Sheets schema tooling)

`backend-v1`: configured via `apps/backend-v1/lsdb.config.ts`, schemas symlinked from
`apps/backend-v1/schemas` → `src/services/sheetDb/schemas`. Run from `apps/backend-v1/`:
```bash
npx lsdb validate | doctor | status | erdiagram | sync
```
`sync --all-users` is **not usable** in `backend-v1` — lsdb's built-in multi-user registry is
never populated (see "Data layer" below); schema rollout to real users happens automatically
per-request instead (`onSchemaMismatch: 'auto-sync'` in `services/sheetDb/adapter.ts`). The
rebuild plan adopts `createUserSheet()` and *does* populate that registry — see
`docs/BACKEND_REBUILD_PLAN.md` §4.3.

## Architecture (of `apps/backend-v1`, the reference implementation)

### OTP login — removed

There used to be a second login path alongside Google OAuth: email/password registration
plus a Telegram-delivered one-time code (`routes/otp-auth.ts`, `controllers/otp-auth.ts`,
`services/google-sheets-otp-adapter.ts`, `services/otp-auth-service.ts`, frontend
`lib/otp-auth-service.ts`, and the OTP form in `login-card.tsx`/`signup-card.tsx`). It's been
removed — Google OAuth (`login()` in `hooks/useAuth.ts`) is the only login path in
`backend-v1`, and `login-card.tsx`/`signup-card.tsx` are Google-button-only.

Also removed as part of the same cleanup: a Postgres/Knex schema for the same OTP entities
(`migrations/`, the `otp-telegram-longcelot` package, `migrate`/`migrate:rollback`
scripts) that turned out to be **dead code** — nothing in `src/` ever imported it; the real
OTP flow ran entirely on the Sheets-based adapter instead. Its presence was two sources of
truth for the same tables and is exactly the kind of trap to watch for elsewhere in this repo.

One deliberately-untouched trace remains: `services/googleSheets/schema-versions.ts` still
provisions `otp_users`/`otp_requests`/`recovery_codes`/`link_tokens`/`telegram_credentials`
sheet tabs for new users, bundled into the same "version 2" migration entry as still-needed
column additions (`telegram_username`/`chatId` on `users`, `emoji` on `categories`). Splitting
those apart risks breaking schema-migration detection for existing users on older versions,
for the sole benefit of not creating a few inert empty tabs — left as-is on purpose. (Moot for
the rebuild — the new schema has no OTP tables to begin with.)

### Two independent storage systems — don't conflate them

1. **`longcelot-sheet-db` (lsdb)** — the budget data itself (categories, transactions,
   budgets, budget_items, budget_incomes, goals, telegram_messages, admin user_stats). Each
   *user* actor's sheet is a real user-owned Google Spreadsheet; there is one *admin* actor
   spreadsheet (`ADMIN_SHEET_ID`) for aggregate stats only.
2. **`services/googleSheets/`** — the pre-lsdb hand-rolled Sheets layer. Superseded by lsdb
   for budget data, but still load-bearing for OAuth callback plumbing and initial sheet
   provisioning (`database.ts`) — see "Legacy/dead code" below.

Never assume budget data lives anywhere but a user's own Sheet via lsdb.

### lsdb actor model (`apps/backend-v1/src/services/sheetDb/`)

- `adapter.ts` builds a single shared `SheetAdapter` (memoized in `adapterPromise`),
  registering every table schema from `schemas/user/*` and `schemas/admin/*`. It requires the
  admin's Google OAuth tokens to already be cached in Redis (captured the first time
  `SUPER_ADMIN_EMAIL` logs in through the normal OAuth callback,
  `controllers/auth/handleCallback.ts`) — admin-dependent routes throw until that has
  happened once.
- `userContext.ts`'s `getUserTable(email, actorSheetId, tableName)` is what every
  controller calls: it scopes a table to one user's spreadsheet via
  `adapter.withContext({ userId: email, actor: 'user', actorSheetId }).table(tableName)`.
  `actorSheetId` (from the user's JWT) does the actual data isolation — `userId` is just an
  opaque label for lsdb's internal bookkeeping.
- Table schemas live one-file-per-table in `schemas/user/*.ts` / `schemas/admin/*.ts`, each a
  `defineTable({ name, actor, columns })` call from `longcelot-sheet-db`.
- **Known, accepted trade-off**: user spreadsheets are still provisioned via the app's own
  per-user OAuth flow (`services/googleSheets/database.ts`), not lsdb's own
  `createUserSheet()`. This means lsdb's built-in admin `users` registry is never populated,
  so `--all-users` CLI/API operations have nothing to iterate over. It also means admin does
  **not** get automatic standing Drive access to every user's sheet (that would be
  `createUserSheet`'s side effect) — see `TODO.md` §1/§1.5 for the full history. The rebuild
  plan reverses this decision on purpose — see `docs/BACKEND_REBUILD_PLAN.md` §4.3.
- lsdb's permission matrix only governs cross-actor access between *non-admin* actors —
  admin-context code always bypasses it. Never construct an admin-actor context aimed at a
  user's `actorSheetId`; admin API routes should only ever touch the admin's own `user_stats`
  table.
- `where` filters in lsdb are exact-match equality only (no range operators); date-range
  filtering (see `controllers/transactions/getTransactions.ts`) is done client-side in
  application code after `findMany()`.

### Legacy/dead code still in the tree (don't extend it)

`apps/backend-v1/src/services/googleSheets/` (the pre-lsdb hand-rolled Sheets CRUD layer) and
`services/GoogleSheetsService.ts` (a thin backward-compat wrapper around it) are superseded
by lsdb for all real per-user Sheets I/O (categories, transactions, budgets, budget_items,
budget_incomes, goals, telegram_messages — see `TODO.md` "Migration Plan" for the audit
trail). Pieces of `googleSheets/` are still load-bearing though: OAuth callback plumbing and
initial sheet provisioning (`database.ts`). When touching Sheets-backed budget data, use the
lsdb path (`sheetDb/userContext.ts`); don't add new callers of `GoogleSheetsService`. (The
rebuild has no equivalent legacy layer at all — see `docs/BACKEND_REBUILD_PLAN.md` §4.2.)

### Backend request flow

- `src/index.ts` wires helmet/CORS/rate-limiting/compression, then mounts routers under
  `/api/v1/{auth,categories,transactions,budgets,goals,settings,telegram,sheets,admin}`.
- Routes → controllers → (lsdb `userContext.ts` or legacy `googleSheets/`) → response.
  Controller module layout follows `docs/CONTROLLER_ARCHITECTURE.md`: one file per endpoint
  under `controllers/[entity]/`, an `index.ts` re-exporting everything, shared Zod schemas
  and types in `types.ts`. (The rebuild keeps this same convention — see
  `docs/BACKEND_REBUILD_PLAN.md` §8.)
- Auth is a custom JWT (`middleware/auth.ts`), not a library like Passport. The decoded token
  carries `{ email, name, spreadsheetId, role, googleCredentials, ... }` — `spreadsheetId` is
  the `actorSheetId` used for every lsdb call in that request. `requireAdmin` gates
  admin-only routes on `role === 'admin'`. **Known issue, fixed in the rebuild plan**:
  embedding the raw Google OAuth `googleCredentials` in the app JWT round-trips it to the
  browser on every request — the rebuild moves Google tokens server-side only.
- `JWT_SECRET`/`JWT_REFRESH_SECRET` have hardcoded dev fallbacks in `middleware/auth.ts` — real
  deployments must set them via env. `POST /api/v1/auth/refresh` is a non-functional stub in
  `backend-v1` (`controllers/auth/refreshToken.ts` never actually issues a new token) — the
  rebuild implements this for real.

### Frontend

- Next.js App Router with route groups: `app/(auth)/*` (login/signup/callback, public) and
  `app/(protected)/*` (dashboard/budget/tracker/categories/goals/settings/summary/admin,
  gated by `components/common/ProtectedRoute.tsx` / `hooks/useProtectedRoute.ts`).
- `lib/*-service.ts` files are thin fetch wrappers per domain (auth, budgets, categories,
  telegram, admin) built on `lib/http-client.ts`; endpoint URLs are centralized in
  `lib/api-config.ts` (`API_ENDPOINTS`), driven by `NEXT_PUBLIC_API_URL`. Not every entry in
  `api-config.ts` is actually called anywhere in the app (e.g. the `TRANSACTIONS`/`GOALS`/
  `SHEETS` blocks) — `docs/BACKEND_REBUILD_PLAN.md` §7 has the full audited live-vs-dead
  breakdown; don't assume a config entry existing means a page calls it.
  Note: some duplicate/older page variants exist in `app/(protected)/categories/`
  (`page.tsx` vs `page-new.tsx`/`new-page.tsx`) and `app/auth/callback/` vs
  `app/(auth)/callback/` — check which one routing actually resolves to before assuming a
  file is live.
- Known frontend bug (pre-existing, not backend-related): `app/(protected)/settings/page.tsx`
  reads its JWT from `localStorage.getItem('token')`, but the rest of the app
  (`auth-service.ts`/`http-client.ts`) stores it under `'auth_token'` — every fetch in that
  page currently sends `Authorization: Bearer null`.
- UI is shadcn/ui (Radix primitives) + Tailwind v4; shared primitives live in
  `components/ui/`, feature components in `components/{budget,categories,charts,common,layout}/`.
- State is React hooks/Context, not Redux/Zustand — see `hooks/useApi.ts`, `hooks/useAuth.ts`,
  `hooks/useBudget.ts`, `hooks/useCategories.ts`.

### Monorepo layout

- `apps/backend-v1` — old backend, reference/rollback only, not part of the active pnpm
  workspace once the housekeeping step in `docs/BACKEND_REBUILD_PLAN.md` §4.1 lands (excluded
  from `pnpm-workspace.yaml` so it stops being built/linted). `apps/backend` — the rebuild
  target; doesn't exist yet. `apps/frontend` — unaffected by any of this.
- `packages/config`, `packages/ui` — shared workspace packages (`@budget-managing/config`,
  `@budget-managing/ui`); currently minimal, build with `tsc`.
- Turbo task graph (`turbo.json`): `build`/`lint`/`type-check`/`security:check` depend on
  upstream package builds (`^build`); `test*` tasks depend on the local `build`.
- Deployment: `render.yaml` (Render, backend + Redis) and `apps/frontend/vercel.json`
  (Vercel). `docker-compose.yml` is available for local containerized runs. **`render.yaml`'s
  `startCommand` points at `apps/backend/dist/index.js`, which doesn't exist until the
  rebuild lands** — deploys are broken until then; this is expected during the transition, not
  a bug to fix in isolation.

## Conventions

- Prettier: single quotes, semicolons, 80-col width, 2-space indent, LF line endings — see
  `.prettierrc.json`. Enforced pre-commit via husky + lint-staged
  (`.lintstagedrc.json`).
- Commit messages: Conventional Commits, enforced by commitlint
  (`commitlint.config.js`) — see recent `git log` for the pattern in practice (`feat:`,
  `fix:`, etc.).
- Request validation uses Zod schemas colocated in each controller module's `types.ts`.
- `docs/` contains a lot of setup/reference material (Google Sheets & Telegram OAuth setup,
  deployment checklists, threat model). `docs/BACKEND_REBUILD_PLAN.md` is the authoritative
  plan for current backend work; `TODO.md` is the historical record of how `backend-v1` got
  to its current state (superseded, not current direction — see the notice at its top).
  `docs/PROJECT_OVERVIEW.md` and `README.md`'s architecture sections describe an even
  earlier/aspirational state (npm workspaces, MFA, a different directory layout) that doesn't
  match any version of the code — treat both as unreliable for architecture questions.
