export default {
  projectName: 'budget-managing-backend',
  actors: [
    { name: 'admin', sheetIdEnv: 'ADMIN_SHEET_ID' },
    // DEV_USER_SHEET_ID is optional — a shared dev/test sheet the 'user'
    // actor's CLI commands (validate/sync/status/erdiagram) target locally.
    // Real users each get their own spreadsheet at runtime, provisioned by
    // src/services/googleSheets/database.ts, not lsdb's own
    // createUserSheet() (see TODO.md §1.5) — which means `lsdb sync
    // --all-users` has nothing to roll out to: lsdb's built-in admin
    // `users` registry, which --all-users reads to find real per-user
    // sheets, is never populated in this app. Schema rollout to existing
    // users instead happens automatically per-request via
    // onSchemaMismatch: 'auto-sync' in src/services/sheetDb/adapter.ts.
    { name: 'user', sheetIdEnv: 'DEV_USER_SHEET_ID' },
  ],
};
