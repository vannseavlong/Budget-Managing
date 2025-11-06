/**
 * Authentication Service - Handles OAuth flow and user authentication
 */

import httpClient from './http-client';
import { API_ENDPOINTS } from './api-config';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google';
  telegram_username?: string;
  chatId?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface GoogleAuthResponse {
  authUrl: string;
}

class AuthService {
  // Storage keys
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  /**
   * Initiate Google OAuth flow
   */
  async initiateGoogleAuth(): Promise<GoogleAuthResponse> {
    try {
      const response = await httpClient.get(API_ENDPOINTS.AUTH.GOOGLE);
      return response.data;
    } catch (error) {
      console.error('Failed to initiate Google auth:', error);
      throw new Error('Failed to start authentication process');
    }
  }

  /**
   * Handle OAuth callback (called when user returns from Google)
   */
  async handleAuthCallback(
    code: string,
    state?: string
  ): Promise<AuthResponse> {
    try {
      const response = await httpClient.post(API_ENDPOINTS.AUTH.CALLBACK, {
        code,
        state,
        provider: 'google',
      });

      const authData: AuthResponse = response.data;
      this.saveAuthData(authData);
      return authData;
    } catch (error) {
      console.error('Auth callback failed:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await httpClient.get(API_ENDPOINTS.AUTH.ME);
      const userData = response.data.user;

      // Transform backend user data to match frontend User interface
      const user: User = {
        id: userData.email, // Use email as ID since backend doesn't provide separate ID
        email: userData.email,
        name: userData.name,
        provider: 'google', // Default to google since that's our only provider
      };

      this.saveUser(user);
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout request failed:', error);
      // Continue with local logout even if server request fails
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Set auth token (used for direct token setting from backend redirects)
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);

    // Log token for API testing (remove in production)
    console.log('🔑 JWT Token for API testing:', token);
    console.log('📋 Copy this token for Postman/API testing');
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Save authentication data to localStorage
   */
  private saveAuthData(authData: AuthResponse): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.TOKEN_KEY, authData.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authData.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user));
  }

  /**
   * Save user data to localStorage
   */
  private saveUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Redirect to Google OAuth
   */
  async redirectToGoogle(): Promise<void> {
    try {
      const { authUrl } = await this.initiateGoogleAuth();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to redirect to Google:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
