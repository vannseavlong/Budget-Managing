import { Request, Response } from 'express';
import { getGoogleOAuthManager } from '../../services/auth/googleOAuth';
import { getAdapter } from '../../services/sheetDb/adapter';
import {
  adminContext,
  getAdminUsersTable,
  recordLogin,
} from '../../services/sheetDb/adminStats';
import { signAccessToken } from '../../services/auth/jwt';
import { isAdminEmail } from '../../utils/adminRole';
import { authCallbackSchema } from './types';
import { logger } from '../../utils/logger';

/**
 * GET /api/v1/auth/callback — the browser lands here directly from Google
 * (this is GOOGLE_REDIRECT_URI), not a JS fetch call. Implements the
 * account-linking rule from docs/BACKEND_REBUILD_PLAN.md §4.4/§6: identity
 * is the email address, not the auth method.
 */
export async function googleCallback(
  req: Request,
  res: Response
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const { code } = authCallbackSchema.parse(req.query);

    const oauth = getGoogleOAuthManager();
    const tokens = (await oauth.getTokens(code)) as {
      id_token?: string | null;
      access_token?: string | null;
      refresh_token?: string | null;
      expiry_date?: number | null;
      token_type?: string | null;
      scope?: string | null;
    };

    if (!tokens.id_token) {
      throw new Error('Google did not return an id_token');
    }

    const profile = (await oauth.verifyToken(tokens.id_token)) as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
      email_verified?: boolean;
    };

    if (profile.email_verified !== true) {
      throw new Error('Google account email is not verified');
    }

    const usersTable = await getAdminUsersTable();
    const existing = await usersTable.findOne({
      where: { email: profile.email },
    });

    const role = isAdminEmail(profile.email) ? 'admin' : 'user';
    let actorSheetId: string;

    if (!existing) {
      const adapter = await getAdapter();
      // createUserSheet's internal write to admin.users goes through
      // table('users'), which enforces lsdb's permission check against
      // whatever context the call runs under — calling it on the bare
      // adapter (no context at all) always fails that check. Needs an
      // explicit admin context, same as getAdminUsersTable() above.
      actorSheetId = await adminContext(adapter).createUserSheet(
        profile.email,
        role,
        profile.email,
        {
          actorTokens: tokens,
          extraFields: {
            google_sub: profile.sub,
            name: profile.name,
            last_login_at: new Date().toISOString(),
          },
        }
      );
    } else {
      actorSheetId = existing.actor_sheet_id as string;
      if (!existing.google_sub) {
        // Account-linking backfill: this email previously registered via
        // password only — same account, same sheet.
        await usersTable.update({
          where: { email: profile.email },
          data: { google_sub: profile.sub, role },
        });
      }
      await recordLogin(profile.email);
    }

    // Only the access token travels in the redirect URL — same as
    // backend-v1. The redirect-based flow has no place to carry a refresh
    // token today (apps/frontend's callback page only reads `?token=`);
    // refresh tokens are only issued by the register/login/refresh JSON
    // endpoints, which do have a response body to put them in.
    const accessToken = signAccessToken({
      email: profile.email,
      name: profile.name,
      spreadsheetId: actorSheetId,
      role,
    });

    logger.info(`User authenticated via Google: ${profile.email}`);

    res.redirect(
      `${frontendUrl}/auth/callback?token=${encodeURIComponent(accessToken)}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Authentication failed';
    logger.error('Error handling Google auth callback:', error);
    res.redirect(
      `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
