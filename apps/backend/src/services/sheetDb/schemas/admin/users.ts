import { defineTable, string, date } from 'longcelot-sheet-db';

// The single account registry for both auth methods (Google OAuth +
// email/password), keyed by email. Identity is the email address, not the
// method — see controllers/auth/* for the account-linking rule. lsdb's own
// `createUserSheet()` writes the first row here directly (user_id, role,
// email, actor_sheet_id, plus whatever `extraFields` the caller passes).
export default defineTable({
  name: 'users',
  actor: 'admin',
  timestamps: true,
  columns: {
    user_id: string().required().unique(),
    email: string().required().unique(),
    role: string().enum(['admin', 'user']).default('user'),
    actor_sheet_id: string().required(),
    password_hash: string(),
    google_sub: string(),
    name: string().required(),
    last_login_at: date(),
  },
});
