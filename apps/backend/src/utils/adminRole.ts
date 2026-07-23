/**
 * Role is never persisted as a source of truth — it's recomputed at
 * login/register time from an env allowlist. ADMIN_EMAILS is a
 * comma-separated list; SUPER_ADMIN_EMAIL is always included too.
 */
export function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const allowlist = [
    ...(process.env.ADMIN_EMAILS?.split(',') ?? []),
    process.env.SUPER_ADMIN_EMAIL ?? '',
  ]
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(normalized);
}
