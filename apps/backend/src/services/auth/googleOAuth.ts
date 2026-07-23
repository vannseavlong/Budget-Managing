import { createLoginOAuthManager, type OAuthManager } from 'longcelot-sheet-db';

let manager: OAuthManager | null = null;

/**
 * `createLoginOAuthManager` (not `createOAuthManager`) — this is the
 * variant whose tokens include an `id_token`, required for `verifyToken()`
 * to resolve Google account identity (sub/email/name/email_verified).
 */
export function getGoogleOAuthManager(): OAuthManager {
  if (manager) return manager;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing Google OAuth configuration: GOOGLE_CLIENT_ID, ' +
        'GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI must all be set.'
    );
  }

  manager = createLoginOAuthManager({ clientId, clientSecret, redirectUri });
  return manager;
}
