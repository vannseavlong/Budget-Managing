/**
 * Admin Service - Clean API layer for admin-only operations
 */

import httpClient from './http-client';
import { API_ENDPOINTS } from './api-config';

class AdminServiceError extends Error {}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  activeWindowDays: number;
}

interface AdminStatsResponse {
  success: boolean;
  data?: AdminStats;
  message?: string;
}

export class AdminService {
  /**
   * Fetch aggregate user stats (total users, active users in the trailing window)
   */
  static async getStats(activeWindowDays?: number): Promise<AdminStats> {
    try {
      const url = activeWindowDays
        ? `${API_ENDPOINTS.ADMIN.STATS}?activeWindowDays=${activeWindowDays}`
        : API_ENDPOINTS.ADMIN.STATS;

      const response = await httpClient.get<AdminStatsResponse>(url);

      if (!response.data.success || !response.data.data) {
        throw new AdminServiceError(
          response.data.message || 'Failed to fetch admin stats'
        );
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw this.handleError(error, 'Failed to fetch admin stats');
    }
  }

  private static handleError(error: any, fallbackMessage: string): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    if (error instanceof AdminServiceError) {
      return new Error(error.message);
    }

    return new Error(fallbackMessage);
  }
}

export default AdminService;
