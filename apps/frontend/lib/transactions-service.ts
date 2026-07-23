/**
 * Transactions Service - thin API layer for transaction operations
 */

import httpClient from './http-client';
import { API_ENDPOINTS } from './api-config';
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionsListResponse,
  TransactionResponse,
} from '../types/transactions';

class TransactionServiceError extends Error {}

export class TransactionsService {
  static async getTransactions(
    filters?: TransactionFilters
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));
    if (filters?.category_id) params.append('category_id', filters.category_id);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.TRANSACTIONS.LIST}?${queryString}`
      : API_ENDPOINTS.TRANSACTIONS.LIST;

    const response = await httpClient.get<TransactionsListResponse>(url);
    if (!response.data.success) {
      throw new TransactionServiceError(
        response.data.message || 'Failed to fetch transactions'
      );
    }
    return response.data.data || [];
  }

  static async createTransaction(
    payload: CreateTransactionRequest
  ): Promise<Transaction> {
    const response = await httpClient.post<TransactionResponse>(
      API_ENDPOINTS.TRANSACTIONS.CREATE,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new TransactionServiceError(
        response.data.message || 'Failed to create transaction'
      );
    }
    return response.data.data;
  }

  static async updateTransaction(
    id: string,
    payload: UpdateTransactionRequest
  ): Promise<Transaction> {
    const response = await httpClient.put<TransactionResponse>(
      API_ENDPOINTS.TRANSACTIONS.UPDATE(id),
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new TransactionServiceError(
        response.data.message || 'Failed to update transaction'
      );
    }
    return response.data.data;
  }

  static async deleteTransaction(id: string): Promise<void> {
    const response = await httpClient.delete<TransactionResponse>(
      API_ENDPOINTS.TRANSACTIONS.DELETE(id)
    );
    if (!response.data.success) {
      throw new TransactionServiceError(
        response.data.message || 'Failed to delete transaction'
      );
    }
  }
}

export default TransactionsService;
