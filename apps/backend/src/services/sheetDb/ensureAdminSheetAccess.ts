import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../../utils/logger';
import type { UserCredentials } from '../googleSheets/types';

/**
 * lsdb's adapter always reads/writes a spreadsheet through the one admin
 * identity it was constructed with (see adapter.ts) — it has no per-request
 * credential swapping outside of `createUserSheet`'s one-time `actorTokens`
 * grant. Sheets created before this app adopted lsdb (or any sheet the
 * admin otherwise doesn't have access to) need that access granted
 * explicitly. This is idempotent: it checks existing permissions first and
 * only creates one if missing.
 */
export async function ensureAdminSheetAccess(
  userCredentials: UserCredentials,
  spreadsheetId: string
): Promise<void> {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!adminEmail) return; // sheet-db isn't configured; nothing to do

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return;

  const userClient = new OAuth2Client(clientId, clientSecret, redirectUri);
  userClient.setCredentials(userCredentials);

  const drive = google.drive({ version: 'v3', auth: userClient });

  const existing = await drive.permissions.list({
    fileId: spreadsheetId,
    fields: 'permissions(emailAddress,role)',
  });

  const alreadyShared = existing.data.permissions?.some(
    (permission) =>
      permission.emailAddress?.toLowerCase() === adminEmail.toLowerCase()
  );
  if (alreadyShared) return;

  await drive.permissions.create({
    fileId: spreadsheetId,
    sendNotificationEmail: false,
    requestBody: {
      type: 'user',
      role: 'writer',
      emailAddress: adminEmail,
    },
  });

  logger.info(
    `Granted sheet-db admin (${adminEmail}) access to spreadsheet ${spreadsheetId}`
  );
}
