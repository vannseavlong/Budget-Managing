import { z } from 'zod';

// Validation schemas
export const authCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// Type definitions
export type AuthCallbackRequest = z.infer<typeof authCallbackSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

export interface AuthResponse {
  success: boolean;
  token?: string;
  refresh_token?: string;
  user?: {
    email: string;
    name?: string;
    picture?: string;
    telegram_username?: string;
    chatId?: string;
  };
  spreadsheetId?: string;
  message: string;
}

export interface ProfileResponse {
  success: boolean;
  user?: {
    email: string;
    name?: string;
    picture?: string;
    telegram_username?: string;
    chatId?: string;
    spreadsheetId: string;
  };
  message: string;
}

export interface DatabaseValidationResponse {
  success: boolean;
  isValid?: boolean;
  missingTables?: string[];
  message: string;
}
