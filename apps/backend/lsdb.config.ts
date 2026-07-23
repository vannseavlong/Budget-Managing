export default {
  projectName: 'budget-managing-backend-v2',
  actors: [
    { name: 'admin', sheetIdEnv: 'ADMIN_SHEET_ID' },
    // DEV_USER_SHEET_ID is optional — a throwaway dev/test sheet the 'user'
    // actor's CLI commands (validate/sync/status) target locally. Real
    // users each get their own spreadsheet at runtime via
    // adapter.createUserSheet(), which also populates lsdb's own admin
    // `users` registry — unlike backend-v1, `lsdb sync --all-users` works
    // here because that registry is actually populated.
    { name: 'user', sheetIdEnv: 'DEV_USER_SHEET_ID' },
  ],
};
