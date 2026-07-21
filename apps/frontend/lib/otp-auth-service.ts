/**
 * OTP Authentication Service
 * Handles email/password + Telegram OTP authentication
 */

import httpClient from './http-client';

export interface OTPUser {
  id: number;
  email: string;
  username: string;
}

export interface OTPRegisterRequest {
  email: string;
  username?: string;
  password: string;
}

export interface OTPRegisterResponse {
  success: boolean;
  message: string;
  data?: OTPUser;
}

export interface OTPLoginRequest {
  email: string;
  password: string;
}

export interface OTPLoginResponse {
  success: boolean;
  message: string;
  data?: {
    sessionToken: string;
    expiresIn: number;
  };
  requiresTelegramLink?: boolean;
}

export interface OTPVerifyRequest {
  sessionToken: string;
  otpCode: string;
}

export interface OTPVerifyResponse {
  success: boolean;
  message: string;
  data?: {
    user: OTPUser;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LinkTelegramRequest {
  telegramChatId: string;
  telegramUsername?: string;
}

export interface OTPStatusResponse {
  success: boolean;
  data?: {
    hasTelegramLinked: boolean;
    isTelegramVerified: boolean;
    telegramUsername: string | null;
  };
}

export const otpAuthService = {
  /**
   * Register a new user with email and password
   */
  async register(data: OTPRegisterRequest): Promise<OTPRegisterResponse> {
    const response = await httpClient.post<OTPRegisterResponse>(
      '/otp-auth/register',
      data
    );
    return response.data;
  },

  /**
   * Login with email and password, receive OTP via Telegram
   */
  async login(data: OTPLoginRequest): Promise<OTPLoginResponse> {
    const response = await httpClient.post<OTPLoginResponse>(
      '/otp-auth/login',
      data
    );
    return response.data;
  },

  /**
   * Verify OTP code and complete login
   */
  async verifyOTP(data: OTPVerifyRequest): Promise<OTPVerifyResponse> {
    const response = await httpClient.post<OTPVerifyResponse>(
      '/otp-auth/verify-otp',
      data
    );
    return response.data;
  },

  /**
   * Link Telegram account to user (requires authentication)
   */
  async linkTelegram(data: LinkTelegramRequest): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.post<{ success: boolean; message: string }>(
      '/otp-auth/link-telegram',
      data
    );
    return response.data;
  },

  /**
   * Get OTP authentication status
   */
  async getStatus(): Promise<OTPStatusResponse> {
    const response = await httpClient.get<OTPStatusResponse>('/otp-auth/status');
    return response.data;
  },
};
