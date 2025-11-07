/**
 * Budgets Service - thin client wrapper for budgets API
 */
import httpClient from './http-client';
import { API_ENDPOINTS } from './api-config';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface Budget {
  id: string;
  year: number;
  month: number;
  income: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  category_id: string;
  category_name: string;
  amount: number;
  spent: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface GetBudgetsFilters {
  year?: number;
  month?: number;
}

export class BudgetsService {
  static async getBudgets(filters?: GetBudgetsFilters): Promise<Budget[]> {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', String(filters.year));
    if (filters?.month) params.append('month', String(filters.month));

    const url = params.toString()
      ? `${API_ENDPOINTS.BUDGETS.LIST}?${params.toString()}`
      : API_ENDPOINTS.BUDGETS.LIST;

    const resp = await httpClient.get<ApiResponse<Budget[]>>(url);
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return resp.data.data || [];
  }

  static async getBudgetItems(budgetId: string): Promise<BudgetItem[]> {
    // Use the listing endpoint which supports optional ?budget_id= filter
    const url = `${API_ENDPOINTS.BUDGETS.ITEMS}?budget_id=${encodeURIComponent(
      budgetId
    )}`;
    const resp = await httpClient.get<ApiResponse<BudgetItem[]>>(url);
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return resp.data.data || [];
  }

  static async createBudget(payload: {
    year: number;
    month: number;
    income: number;
  }): Promise<Budget> {
    const resp = await httpClient.post<ApiResponse<Budget>>(
      API_ENDPOINTS.BUDGETS.CREATE,
      payload
    );
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return resp.data.data as Budget;
  }

  static async createIncome(payload: {
    year: number;
    month: number;
    amount: number;
    source?: string;
  }) {
    const resp = await httpClient.post<ApiResponse<any>>(
      API_ENDPOINTS.BUDGETS.INCOMES,
      payload
    );
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return resp.data.data;
  }

  static async getIncomes() {
    const resp = await httpClient.get<ApiResponse<any[]>>(
      API_ENDPOINTS.BUDGETS.INCOMES
    );
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return resp.data.data || [];
  }

  static async updateIncome(
    id: string,
    payload: {
      year: number;
      month: number;
      amount: number;
      source?: string;
    }
  ) {
    const resp = await httpClient.put<ApiResponse<any>>(
      API_ENDPOINTS.BUDGETS.INCOMES_UPDATE(id),
      payload
    );
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return resp.data.data;
  }

  static async deleteIncome(id: string) {
    const resp = await httpClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.BUDGETS.INCOMES_DELETE(id)
    );
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return true;
  }

  static async getIncomeSum(year: number, month: number): Promise<number> {
    const params = new URLSearchParams();
    params.append('year', String(year));
    params.append('month', String(month));
    const url = `${API_ENDPOINTS.BUDGETS.INCOMES_SUM}?${params.toString()}`;
    const resp = await httpClient.get<ApiResponse<{ total: number }>>(url);
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return resp.data.data?.total || 0;
  }

  static async createBudgetItem(payload: {
    budget_id: string;
    category_id: string;
    category_name: string;
    amount: number;
  }) {
    const url = `${API_ENDPOINTS.BUDGETS.LIST}/items`;
    const resp = await httpClient.post<ApiResponse<any>>(url, payload);
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return resp.data.data;
  }

  static async updateBudget(id: string, payload: any) {
    const resp = await httpClient.put<ApiResponse<Budget>>(
      API_ENDPOINTS.BUDGETS.UPDATE(id),
      payload
    );
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return resp.data.data as Budget;
  }

  static async updateBudgetItem(id: string, payload: any) {
    const url = `${API_ENDPOINTS.BUDGETS.LIST}/items/${id}`;
    const resp = await httpClient.put<ApiResponse<any>>(url, payload);
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return resp.data.data;
  }

  static async deleteBudget(id: string) {
    const resp = await httpClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.BUDGETS.DELETE(id)
    );
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return true;
  }

  static async deleteBudgetItem(id: string) {
    const url = `${API_ENDPOINTS.BUDGETS.LIST}/items/${id}`;
    const resp = await httpClient.delete<ApiResponse<void>>(url);
    if (!resp.data.success) throw new Error(resp.data.message || 'Failed');
    return true;
  }
}

export default BudgetsService;
