import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { AuthClient, UserCredentials } from './types';
import { logger } from '../../utils/logger';

let oauth2Client: OAuth2Client | null = null;
let initialized = false;

export function initializeIfNeeded(): void {
  if (initialized) return;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${backendUrl}/api/v1/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
    );
  }

  oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  initialized = true;
  logger.info('Google OAuth client initialized');
}

export function getAuthenticatedClient(): AuthClient {
  initializeIfNeeded();
  if (!oauth2Client) throw new Error('OAuth client not initialized');
  return oauth2Client;
}

export function getAuthUrl(): string {
  const client = getAuthenticatedClient();
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

export async function getTokens(code: string): Promise<UserCredentials> {
  try {
    const client = getAuthenticatedClient();
    const { tokens } = await client.getToken(code);
    return tokens as UserCredentials;
  } catch (error) {
    logger.error('Error getting tokens:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

export function setCredentials(credentials: UserCredentials): void {
  const client = getAuthenticatedClient();
  client.setCredentials(credentials);
}
