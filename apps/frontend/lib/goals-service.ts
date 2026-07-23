/**
 * Goals Service - thin API layer for goal operations
 */

import httpClient from './http-client';
import { API_ENDPOINTS } from './api-config';
import type {
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalsListResponse,
  GoalResponse,
} from '../types/goals';

class GoalServiceError extends Error {}

export class GoalsService {
  static async getGoals(): Promise<Goal[]> {
    const response = await httpClient.get<GoalsListResponse>(
      API_ENDPOINTS.GOALS.LIST
    );
    if (!response.data.success) {
      throw new GoalServiceError(response.data.message || 'Failed to fetch goals');
    }
    return response.data.data || [];
  }

  static async createGoal(payload: CreateGoalRequest): Promise<Goal> {
    const response = await httpClient.post<GoalResponse>(
      API_ENDPOINTS.GOALS.CREATE,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new GoalServiceError(response.data.message || 'Failed to create goal');
    }
    return response.data.data;
  }

  static async updateGoal(
    id: string,
    payload: UpdateGoalRequest
  ): Promise<Goal> {
    const response = await httpClient.put<GoalResponse>(
      API_ENDPOINTS.GOALS.UPDATE(id),
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new GoalServiceError(response.data.message || 'Failed to update goal');
    }
    return response.data.data;
  }

  static async deleteGoal(id: string): Promise<void> {
    const response = await httpClient.delete<GoalResponse>(
      API_ENDPOINTS.GOALS.DELETE(id)
    );
    if (!response.data.success) {
      throw new GoalServiceError(response.data.message || 'Failed to delete goal');
    }
  }
}

export default GoalsService;
